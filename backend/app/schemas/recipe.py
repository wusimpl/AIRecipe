"""Recipe request/response models and schema validation helpers."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any, Dict, Literal

from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError
from pydantic import BaseModel, Field

from app.core.config import get_settings


class RecipeGenerationRequest(BaseModel):
    """Incoming payload for generating a recipe."""

    dish_name: str = Field(..., min_length=1, max_length=64)
    servings: int = Field(2, ge=1, le=12)
    dietary_preferences: list[str] = Field(default_factory=list)
    ingredients: list[str] = Field(default_factory=list)
    language: str = Field(default="zh")
    extra_instructions: str | None = Field(default=None, max_length=500)
    provider: str | None = Field(
        default=None, min_length=1, max_length=64, description="指定使用的模型提供商"
    )
    routing_strategy: Literal["default", "weighted"] | None = Field(
        default=None, description="覆盖默认的模型路由策略"
    )


class RecipeGenerationResponse(BaseModel):
    """API response after generating a recipe."""

    request_id: str
    provider: str
    recipe: Dict[str, Any]
    cached: bool = Field(default=False, description="Whether the recipe was served from cache")


class RecipeCacheRequest(BaseModel):
    """前端回传清洗后的菜谱结果，用于后端缓存。"""

    dish_name: str = Field(..., min_length=1, max_length=64, description="原始请求中的菜名")
    provider: str = Field(..., min_length=1, max_length=64, description="实际使用的模型提供商")
    recipe: Dict[str, Any] = Field(..., description="前端清理后的菜谱 JSON 对象")


class RecipeProviderInfo(BaseModel):
    """Summary of an available LLM provider."""

    name: str = Field(..., description="Provider identifier")
    model: str = Field(..., description="Underlying model name")
    type: str = Field(..., description="Provider implementation type")
    description: str | None = Field(None, description="Provider description")


class RecipeProvidersResponse(BaseModel):
    """Available providers and default routing configuration."""

    default_provider: str = Field(..., description="Default provider used by the service")
    providers: list[RecipeProviderInfo] = Field(
        default_factory=list, description="List of configured providers"
    )


class RequireApiKeyResponse(BaseModel):
    """Configuration response for API key requirement."""

    requireApiKey: bool = Field(..., description="Whether API key is required")


@lru_cache(maxsize=1)
def _load_recipe_schema() -> Dict[str, Any]:
    path = get_settings().recipe_schema_path
    data = json.loads(path.read_text(encoding="utf-8"))
    return data


@lru_cache(maxsize=1)
def _get_recipe_validator() -> Draft7Validator:
    schema = _load_recipe_schema()
    return Draft7Validator(schema)


def validate_recipe_output(payload: Dict[str, Any]) -> None:
    """Validate the model output against the recipe JSON schema."""
    validator = _get_recipe_validator()
    errors = sorted(validator.iter_errors(payload), key=lambda err: err.path)
    if errors:
        first = errors[0]
        path = ".".join(str(item) for item in first.path)
        message = f"{path or 'root'}: {first.message}"
        raise ValidationError(message)
