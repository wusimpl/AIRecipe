"""Centralised error mapping for FastAPI responses."""

from __future__ import annotations

from typing import Any, Callable, Tuple, Type

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.recipe_service import (
    RecipeProviderError,
    RecipeServiceError,
    RecipeValidationError,
    UnknownProviderError,
    UnsupportedRoutingStrategy,
)

ErrorHandler = Callable[[Request, Exception], JSONResponse]


def _build_payload(request: Request, *, code: str, message: str) -> dict[str, Any]:
    request_id = getattr(request.state, "request_id", None)
    return {"error": {"code": code, "message": message, "request_id": request_id}}


def _handler_factory(status_code: int, code: str) -> ErrorHandler:
    async def _handler(request: Request, exc: Exception) -> JSONResponse:
        payload = _build_payload(request, code=code, message=str(exc))
        return JSONResponse(status_code=status_code, content=payload)

    return _handler


def register_exception_handlers(app: FastAPI) -> None:
    """Attach application wide exception handlers."""
    mapping: list[Tuple[Type[Exception], int, str]] = [
        (RecipeValidationError, 422, "validation_error"),
        (UnknownProviderError, 400, "unknown_provider"),
        (UnsupportedRoutingStrategy, 400, "invalid_routing_strategy"),
        (RecipeProviderError, 502, "provider_error"),
        (RecipeServiceError, 500, "recipe_service_error"),
    ]
    for exc_type, status_code, code in mapping:
        app.add_exception_handler(exc_type, _handler_factory(status_code, code))
