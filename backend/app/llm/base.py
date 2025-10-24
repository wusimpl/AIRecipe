"""Backward-compatible export for provider base classes."""

from app.llm.providers.base import ProviderSettings, RecipeLLMProvider

__all__ = ["ProviderSettings", "RecipeLLMProvider"]
