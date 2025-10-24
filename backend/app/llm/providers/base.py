"""Base abstractions for LLM provider integrations."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict


@dataclass(frozen=True)
class ProviderSettings:
    """Runtime settings for a provider implementation."""

    name: str
    type: str
    model: str
    api_base: str
    api_key: str
    timeout: float = 30.0
    max_retries: int = 2
    backoff_factor: float = 0.5
    weight: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class RecipeLLMProvider(ABC):
    """Abstract base class for recipe-oriented LLM providers."""

    name: str
    model: str

    @abstractmethod
    async def generate(self, *, prompt: str) -> str:
        """Return the raw model output for the provided prompt."""

    @abstractmethod
    async def generate_stream(self, *, prompt: str) -> AsyncIterator[str]:
        """Return an async iterator yielding the raw model output chunks."""

    async def aclose(self) -> None:
        """Release any underlying resources."""
