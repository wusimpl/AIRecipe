"""Provider registry and selection utilities."""

from __future__ import annotations

import asyncio
import logging
from collections import deque
from itertools import cycle
from typing import Dict, Iterable

from app.core.config import LLMProvidersConfig, ProviderConfig
from app.llm import MockLLMProvider
from app.llm.base import ProviderSettings, RecipeLLMProvider
from app.llm.providers.openai_like import OpenAILikeLLMProvider

logger = logging.getLogger(__name__)


class ProviderBuildError(RuntimeError):
    """Raised when a provider cannot be constructed."""


class WeightedRoundRobin:
    """Deterministic weighted selection helper."""

    def __init__(self, weights: Dict[str, float]) -> None:
        self._lock = asyncio.Lock()
        if not weights:
            self._cycle = iter(())
            self._sequence = deque()
            return
        positive_weights = {k: max(v, 0.0) for k, v in weights.items()}
        filtered = {k: v for k, v in positive_weights.items() if v > 0}
        if not filtered:
            filtered = {next(iter(weights)): 1.0}
        min_weight = min(filtered.values())
        sequence: list[str] = []
        for name, weight in filtered.items():
            multiplier = max(1, int(round(weight / min_weight)))
            sequence.extend([name] * multiplier)
        self._sequence = deque(sequence)
        self._cycle = cycle(self._sequence)

    async def next(self) -> str:
        if not self._sequence:
            raise RuntimeError("No providers configured for weighted routing")
        async with self._lock:
            return next(self._cycle)


class ProviderRegistry:
    """Maintain instantiated providers and routing behaviour."""

    def __init__(self, config: LLMProvidersConfig) -> None:
        self._config = config
        self._providers: Dict[str, RecipeLLMProvider] = {}
        self._weighted = WeightedRoundRobin(
            {name: provider.weight for name, provider in config.providers.items()}
        )

    async def startup(self) -> None:
        """Instantiate configured providers."""
        for name, provider_config in self._config.providers.items():
            provider = self._build_provider(provider_config)
            self._providers[name] = provider
            logger.info("Registered provider '%s' (%s)", name, provider_config.type)

    async def shutdown(self) -> None:
        """Release provider resources."""
        for provider in self._providers.values():
            try:
                await provider.aclose()
            except Exception:  # pragma: no cover - defensive
                logger.exception("Failed to close provider %s", provider.name)

    def get(self, name: str) -> RecipeLLMProvider:
        try:
            return self._providers[name]
        except KeyError as exc:
            raise KeyError(f"provider '{name}' is not registered") from exc

    @property
    def default_strategy(self) -> str:
        return self._config.routing.strategy

    async def resolve(self, *, requested: str | None = None, strategy: str | None = None) -> RecipeLLMProvider:
        """Resolve a provider based on request parameters and routing config."""
        if requested:
            return self.get(requested)

        resolved_strategy = (strategy or self._config.routing.strategy).lower()
        if resolved_strategy == "weighted":
            name = await self._weighted.next()
            return self.get(name)
        if resolved_strategy == "default":
            return self.get(self._config.default_provider)

        raise ValueError(f"unsupported routing strategy '{resolved_strategy}'")

    def all_providers(self) -> Iterable[RecipeLLMProvider]:
        return tuple(self._providers.values())

    def _build_provider(self, config: ProviderConfig) -> RecipeLLMProvider:
        settings = ProviderSettings(
            name=config.name,
            type=config.type,
            model=config.model,
            api_base=config.api_base,
            api_key=config.api_key,
            timeout=config.timeout,
            max_retries=config.max_retries,
            backoff_factor=config.backoff_factor,
            weight=config.weight,
            metadata=config.metadata,
        )

        if config.type == "mock":
            return MockLLMProvider(
                name=config.name,
                model=config.model,
                base_url=config.api_base or "https://mock-llm.local",
                timeout=config.timeout,
                path=config.metadata.get("path", "/v1/chat/completions"),
            )
        if config.type in {"openai-like", "openai"}:
            return OpenAILikeLLMProvider(settings)

        raise ProviderBuildError(f"Unknown provider type '{config.type}' for '{config.name}'")
