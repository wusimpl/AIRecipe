"""Recipe generation service coordinating providers, caching, and validation."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, AsyncIterator, Dict
from uuid import uuid4

import httpx
from jsonschema.exceptions import ValidationError as SchemaValidationError

from app.core.cache import CacheBackend, get_cache_backend
from app.core.config import get_settings
from app.llm.base import RecipeLLMProvider
from app.llm.registry import ProviderRegistry
from app.prompts.loader import load_prompt
from app.schemas.recipe import (
    RecipeGenerationRequest,
    RecipeGenerationResponse,
    validate_recipe_output,
)

logger = logging.getLogger(__name__)


class RecipeServiceError(RuntimeError):
    """Base exception for recipe service errors."""


class RecipeProviderError(RecipeServiceError):
    """Raised when communicating with the provider fails."""


class RecipeValidationError(RecipeServiceError):
    """Raised when parsing or validating the provider output fails."""


class UnknownProviderError(RecipeServiceError):
    """Raised when a requested provider cannot be found."""


class UnsupportedRoutingStrategy(RecipeServiceError):
    """Raised when an unsupported routing strategy is requested."""


class RecipeCacheMissError(RecipeServiceError):
    """Raised when a requested recipe is not yet cached."""


class RecipeService:
    """Generate structured recipes using configured providers."""

    def __init__(
        self,
        provider: RecipeLLMProvider | None = None,
        *,
        registry: ProviderRegistry | None = None,
        cache: CacheBackend | None = None,
    ) -> None:
        if provider is None and registry is None:
            raise ValueError("either provider or registry must be supplied")
        self._provider = provider
        self._registry = registry
        self._cache = cache
        self._settings = get_settings()

    async def generate_recipe(
        self, request: RecipeGenerationRequest
    ) -> RecipeGenerationResponse:
        provider = await self._resolve_provider(request)
        cache = self._get_cache()
        cache_key = self._make_cache_key(provider.name, request)
        cached_payload = await self._fetch_from_cache(cache, cache_key)
        if cached_payload is None:
            logger.info(
                "Cache miss for provider '%s' and dish '%s'",
                provider.name,
                request.dish_name,
            )
            raise RecipeCacheMissError(
                f"recipe '{request.dish_name}' for provider '{provider.name}' is not cached"
            )

        logger.info(
            "Cache hit for provider '%s' and dish '%s'",
            provider.name,
            request.dish_name,
        )
        return self._build_response(provider.name, cached_payload, cached=True)

    async def generate_recipe_stream(
        self, request: RecipeGenerationRequest
    ) -> AsyncIterator[str]:
        """Generate recipe with streaming output.

        如果命中缓存，则直接下发完整 JSON 响应；否则透传模型原始流式内容，
        由前端自行清理并在需要时回填缓存。
        """
        provider = await self._resolve_provider(request)
        prompt_template = await load_prompt(self._settings.system_prompt_path)
        prompt = self._build_prompt(prompt_template, request)
        logger.debug("Generated streaming prompt for %s: %s", request.dish_name, prompt)

        # Check cache first
        cache = self._get_cache()
        cache_key = self._make_cache_key(provider.name, request)
        cached_payload = await self._fetch_from_cache(cache, cache_key)

        if cached_payload is not None:
            # Cache hit: return complete response as single JSON chunk
            logger.info(
                "Cache hit for streaming request - provider '%s' and dish '%s'",
                provider.name,
                request.dish_name,
            )
            response = self._build_response(provider.name, cached_payload, cached=True)
            # Yield the complete response as JSON
            yield json.dumps(response.model_dump(), ensure_ascii=False)
            return

        # Cache miss: stream from provider and let frontend handle post-processing
        logger.info(
            "Cache miss for streaming request - provider '%s' and dish '%s'",
            provider.name,
            request.dish_name,
        )

        try:
            async for chunk in provider.generate_stream(prompt=prompt):
                yield chunk
        except httpx.HTTPError as exc:  # pragma: no cover - defensive
            logger.exception("Provider streaming request failed")
            raise RecipeProviderError("provider streaming request failed") from exc

    async def _resolve_provider(
        self, request: RecipeGenerationRequest
    ) -> RecipeLLMProvider:
        if self._registry is not None:
            strategy = request.routing_strategy or self._registry.default_strategy
            try:
                return await self._registry.resolve(
                    requested=request.provider,
                    strategy=strategy,
                )
            except KeyError as exc:
                raise UnknownProviderError(str(exc)) from exc
            except ValueError as exc:
                raise UnsupportedRoutingStrategy(str(exc)) from exc

        if self._provider is None:
            raise RecipeServiceError("no provider configured")
        if request.provider and request.provider != self._provider.name:
            raise UnknownProviderError(
                f"provider '{request.provider}' unavailable for this deployment"
            )
        return self._provider

    def _build_prompt(
        self, template: str, request: RecipeGenerationRequest
    ) -> str:
        payload = {
            "dish_name": request.dish_name,
            "servings": request.servings,
            "dietary_preferences": request.dietary_preferences,
            "ingredients": request.ingredients,
            "language": request.language,
            "extra_instructions": request.extra_instructions,
        }
        user_context = json.dumps(payload, ensure_ascii=False, indent=2)
        return (
            f"{template.strip()}\n\n---\n请根据以下用户需求生成符合 Schema 的菜谱：\n{user_context}"
        )

    def _build_response(
        self, provider_name: str, recipe_payload: Dict[str, Any], *, cached: bool
    ) -> RecipeGenerationResponse:
        response = RecipeGenerationResponse(
            request_id=str(uuid4()),
            provider=provider_name,
            recipe=recipe_payload,
            cached=cached,
        )
        logger.info(
            "Generated recipe for '%s' with provider '%s' (cached=%s)",
            recipe_payload.get("菜名", "unknown"),
            provider_name,
            cached,
        )
        return response

    async def cache_recipe_from_frontend(
        self,
        *,
        provider_name: str,
        dish_name: str,
        recipe_payload: Dict[str, Any],
    ) -> RecipeGenerationResponse:
        """Persist a cleaned recipe payload supplied by the frontend.

        Validates the payload before storing it in the shared cache so repeated
        requests can be served instantly. Intended to be used when the stream
        contained reasoning markers (e.g. <think>) that prevented automatic
        caching on the backend.
        """
        try:
            validate_recipe_output(recipe_payload)
        except SchemaValidationError as exc:
            logger.warning(
                "前端回传的菜谱 Schema 校验失败 (菜名: %s, 提供商: %s): %s",
                dish_name,
                provider_name,
                exc,
            )
            raise RecipeValidationError(str(exc)) from exc

        cache = self._get_cache()
        cache_key = self._make_cache_key_from_dish(provider_name, dish_name)
        await self._store_in_cache(cache, cache_key, recipe_payload)
        return self._build_response(provider_name, recipe_payload, cached=False)

    def _make_cache_key(
        self, provider_name: str, request: RecipeGenerationRequest
    ) -> str:
        dish_name = request.dish_name
        return self._make_cache_key_from_dish(provider_name, dish_name)

    def _make_cache_key_from_dish(self, provider_name: str, dish_name: str) -> str:
        # Use dish_name and provider_name for cache key
        # Same dish with different providers will have different cache entries
        normalized_name = dish_name.strip().lower()
        cache_input = f"{normalized_name}:{provider_name}"
        digest = hashlib.sha256(cache_input.encode("utf-8")).hexdigest()
        return f"recipe:{digest}"

    async def _fetch_from_cache(
        self, cache: CacheBackend | None, key: str
    ) -> Dict[str, Any] | None:
        if cache is None:
            return None
        cached = await cache.get(key)
        if cached is None:
            return None
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            await cache.delete(key)
            return None

    async def _store_in_cache(
        self, cache: CacheBackend | None, key: str, payload: Dict[str, Any]
    ) -> None:
        if cache is None:
            return

        dish_name = payload.get("菜名", "未知菜名")
        logger.info(
            "准备缓存菜谱 - 菜名: '%s', 缓存键: %s",
            dish_name,
            key
        )

        await cache.set(key, json.dumps(payload, ensure_ascii=False))

        logger.info(
            "成功缓存菜谱 - 菜名: '%s', 缓存键: %s",
            dish_name,
            key
        )

    def _get_cache(self) -> CacheBackend | None:
        if self._cache is not None:
            return self._cache
        try:
            return get_cache_backend()
        except RuntimeError:
            return None
