"""Recipe generation API routes."""

from __future__ import annotations

import logging
from typing import Annotated, AsyncIterator

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.config import get_llm_providers, get_settings
from app.schemas.recipe import (
    RecipeCacheRequest,
    RecipeGenerationRequest,
    RecipeGenerationResponse,
    RecipeProviderInfo,
    RecipeProvidersResponse,
    RequireApiKeyResponse,
)
from app.services import (
    RecipeCacheMissError,
    RecipeService,
    RecipeServiceError,
    RecipeValidationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/recipes", tags=["recipes"])


async def get_recipe_service(request: Request) -> RecipeService:
    try:
        return request.app.state.recipe_service
    except AttributeError as exc:  # pragma: no cover - defensive branch
        raise RuntimeError("recipe service not initialised") from exc


async def verify_api_key(
    api_key: Annotated[str | None, Header(alias="X-API-Key")] = None
) -> None:
    settings = get_settings()

    # 检查是否需要 API Key 验证
    if not settings.require_api_key:
        logger.info("API Key 验证已禁用（REQUIRE_API_KEY=false）")
        return

    # 验证 API Key
    if api_key is None or api_key not in settings.api_keys:
        logger.warning("Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
        )


@router.post(
    "/generate",
    response_model=RecipeGenerationResponse,
    status_code=status.HTTP_200_OK,
)
async def generate_recipe(
    payload: RecipeGenerationRequest,
    _: None = Depends(verify_api_key),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeGenerationResponse:
    try:
        return await service.generate_recipe(payload)
    except RecipeCacheMissError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/cache",
    response_model=RecipeGenerationResponse,
    status_code=status.HTTP_200_OK,
)
async def cache_recipe_result(
    payload: RecipeCacheRequest,
    _: None = Depends(verify_api_key),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeGenerationResponse:
    try:
        return await service.cache_recipe_from_frontend(
            provider_name=payload.provider,
            dish_name=payload.dish_name,
            recipe_payload=payload.recipe,
        )
    except RecipeValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except RecipeServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc


@router.post(
    "/generate/stream",
    status_code=status.HTTP_200_OK,
)
async def generate_recipe_stream(
    payload: RecipeGenerationRequest,
    _: None = Depends(verify_api_key),
    service: RecipeService = Depends(get_recipe_service),
) -> StreamingResponse:
    """Generate recipe with streaming output via SSE.

    Returns Server-Sent Events (SSE) stream with recipe content.
    Each event contains a chunk of the generated recipe JSON.
    The stream ends with a 'data: [DONE]' message.
    """
    async def event_generator() -> AsyncIterator[str]:
        """Generate SSE-formatted events from the recipe stream."""
        try:
            async for chunk in service.generate_recipe_stream(payload):
                # SSE format: data: {content}\n\n
                yield f"data: {chunk}\n\n"
            # Send completion signal
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.exception("Error during streaming generation")
            # Send error event
            error_msg = str(exc)
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )


@router.get(
    "/providers",
    response_model=RecipeProvidersResponse,
    status_code=status.HTTP_200_OK,
)
async def list_recipe_providers(
    _: None = Depends(verify_api_key),
) -> RecipeProvidersResponse:
    config = get_llm_providers()
    providers = [
        RecipeProviderInfo(
            name=item.name,
            model=item.model,
            type=item.type,
            description=item.description,
        )
        for item in config.providers.values()
        if item.switch
    ]
    return RecipeProvidersResponse(
        default_provider=config.default_provider,
        providers=providers,
    )


@router.get(
    "/config/require-api-key",
    response_model=RequireApiKeyResponse,
    status_code=status.HTTP_200_OK,
)
async def get_require_api_key_config() -> RequireApiKeyResponse:
    """获取 API Key 验证配置。

    此端点不需要 API Key 验证，用于前端查询是否需要输入 API Key。
    """
    settings = get_settings()
    logger.info(f"配置查询: require_api_key={settings.require_api_key}")
    return RequireApiKeyResponse(requireApiKey=settings.require_api_key)
