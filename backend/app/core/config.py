"""Application configuration utilities."""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

import yaml

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProviderConfig:
    """Configuration for a single LLM provider."""

    name: str
    type: str
    api_base: str
    model: str
    api_key: str
    timeout: float = 30.0
    max_retries: int = 2
    backoff_factor: float = 0.5
    weight: float = 1.0
    switch: bool = True
    description: str | None = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class RoutingConfig:
    """Routing strategy configuration."""

    strategy: str = "default"  # default | weighted


@dataclass(frozen=True)
class LLMProvidersConfig:
    """Collection of provider configurations with routing information."""

    default_provider: str
    providers: Dict[str, ProviderConfig] = field(default_factory=dict)
    routing: RoutingConfig = field(default_factory=RoutingConfig)

    def require(self, name: str | None = None) -> ProviderConfig:
        target = name or self.default_provider
        try:
            return self.providers[target]
        except KeyError as exc:  # pragma: no cover - defensive branch
            raise ValueError(f"unknown provider '{target}'") from exc


def _substitute_env(value: Any) -> Any:
    """Resolve `${ENV_VAR}` placeholders in configuration values."""
    if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
        env_key = value[2:-1]
        return os.getenv(env_key, "")
    return value


def _int_env(variable: str, default: int) -> int:
    value = os.getenv(variable)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        logger.warning("Invalid integer for %s: %s - falling back to %s", variable, value, default)
        return default


def _tuple_env(variable: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw = os.getenv(variable)
    if raw is None:
        return default
    items = tuple(item.strip() for item in raw.split(",") if item.strip())
    return items or default


def _bool_env(variable: str, default: bool) -> bool:
    raw = os.getenv(variable)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _load_config_data(path: Path) -> Dict[str, Any]:
    """Load provider configuration data from JSON or YAML files."""
    raw = path.read_text(encoding="utf-8")
    if path.suffix.lower() in {".yaml", ".yml"}:
        data = yaml.safe_load(raw)
    else:
        data = json.loads(raw)
    return data or {}


@dataclass(frozen=True)
class AppSettings:
    """Top-level application settings."""

    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    require_api_key: bool = field(
        default_factory=lambda: _bool_env("REQUIRE_API_KEY", True)
    )
    api_keys: frozenset[str] = field(
        default_factory=lambda: frozenset(
            key.strip()
            for key in os.getenv("API_KEYS", "demo-key").split(",")
            if key.strip()
        )
    )
    llm_config_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("LLM_CONFIG_PATH", "config/llm_providers.yaml")
        )
    )
    system_prompt_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("SYSTEM_PROMPT_PATH", "prompt/system_recipe.txt")
        )
    )
    recipe_schema_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("RECIPE_SCHEMA_PATH", "schemas/recipe_output.json")
        )
    )
    cache_backend: str = field(
        default_factory=lambda: os.getenv("CACHE_BACKEND", "redis")
    )
    redis_url: str | None = field(default_factory=lambda: os.getenv("REDIS_URL"))
    cors_allow_origins: tuple[str, ...] = field(
        default_factory=lambda: _tuple_env("CORS_ALLOW_ORIGINS", ("*",))
    )
    cors_allow_methods: tuple[str, ...] = field(
        default_factory=lambda: _tuple_env(
            "CORS_ALLOW_METHODS", ("GET", "POST", "OPTIONS")
        )
    )
    cors_allow_headers: tuple[str, ...] = field(
        default_factory=lambda: _tuple_env("CORS_ALLOW_HEADERS", ("*",))
    )
    cors_allow_credentials: bool = field(
        default_factory=lambda: _bool_env("CORS_ALLOW_CREDENTIALS", False)
    )

    def load_llm_providers(self) -> LLMProvidersConfig:
        path = self.llm_config_path
        if not path.exists():
            logger.warning("LLM config path %s does not exist", path)
            return LLMProvidersConfig(
                default_provider="mock", providers={}, routing=RoutingConfig()
            )

        data = _load_config_data(path)
        raw_providers = data.get("providers", {})
        providers: Dict[str, ProviderConfig] = {}

        # Support both dict-style and list-style provider declarations for flexibility.
        if isinstance(raw_providers, dict):
            iterable = raw_providers.items()
        elif isinstance(raw_providers, list):
            iterable = []
            for index, payload in enumerate(raw_providers):
                if not isinstance(payload, dict):
                    logger.warning(
                        "Skipping provider entry at index %s in %s: expected object, got %s",
                        index,
                        path,
                        type(payload).__name__,
                    )
                    continue
                name = payload.get("name")
                if not name:
                    logger.warning(
                        "Skipping provider entry at index %s in %s: missing 'name'",
                        index,
                        path,
                    )
                    continue
                iterable.append((name, payload))
        else:
            logger.warning(
                "Unexpected provider configuration format in %s: %s",
                path,
                type(raw_providers).__name__,
            )
            iterable = []

        for name, payload in iterable:
            providers[name] = ProviderConfig(
                name=name,
                type=payload.get("type", "openai-like"),
                api_base=_substitute_env(payload.get("api_base", "")),
                model=payload.get("model", ""),
                api_key=_substitute_env(payload.get("api_key", "")),
                timeout=float(payload.get("timeout", 30)),
                max_retries=int(payload.get("max_retries", 2)),
                backoff_factor=float(payload.get("backoff_factor", 0.5)),
                weight=float(payload.get("weight", 1)),
                switch=bool(payload.get("switch", True)),
                metadata={
                    key: value
                    for key, value in payload.items()
                    if key
                    not in {
                        "name",
                        "type",
                        "api_base",
                        "model",
                        "api_key",
                        "timeout",
                        "max_retries",
                        "backoff_factor",
                        "weight",
                        "switch",
                    }
                },
            )

        default_provider = data.get("default_provider")
        if default_provider is None or default_provider not in providers:
            logger.warning(
                "Default provider missing or unknown in %s, falling back to first provider",
                path,
            )
            default_provider = next(iter(providers), "mock")

        routing_data = data.get("routing", {})
        routing = RoutingConfig(strategy=routing_data.get("strategy", "default"))

        return LLMProvidersConfig(
            default_provider=default_provider,
            providers=providers,
            routing=routing,
        )


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """Return cached application settings."""
    return AppSettings()


@lru_cache(maxsize=1)
def get_llm_providers() -> LLMProvidersConfig:
    """Load and cache provider configuration."""
    return get_settings().load_llm_providers()
