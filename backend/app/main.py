"""FastAPI application entrypoint for AIRecipe."""

from __future__ import annotations

import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.cache import get_cache_backend, init_cache_backend
from app.core.config import get_llm_providers, get_settings
from app.core.errors import register_exception_handlers
from app.llm.registry import ProviderRegistry
from app.middleware import (
    RequestIDMiddleware,
    StructuredLoggingMiddleware,
)
from app.routers import recipes
from app.services import RecipeService

load_dotenv()
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)

    app = FastAPI(
        title="AIRecipe API",
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    register_exception_handlers(app)

    app.add_middleware(StructuredLoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allow_origins),
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=list(settings.cors_allow_methods),
        allow_headers=list(settings.cors_allow_headers),
    )

    @app.on_event("startup")
    async def startup_event() -> None:
        logger.info("Starting AIRecipe application")
        await init_cache_backend(settings)
        cache_backend = get_cache_backend()

        providers_config = get_llm_providers()
        registry = ProviderRegistry(providers_config)
        await registry.startup()

        app.state.cache_backend = cache_backend
        app.state.provider_registry = registry
        app.state.recipe_service = RecipeService(
            registry=registry,
            cache=cache_backend,
        )

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("Shutting down AIRecipe application")
        registry = getattr(app.state, "provider_registry", None)
        if registry is not None:
            await registry.shutdown()
        cache_backend = getattr(app.state, "cache_backend", None)
        if cache_backend is not None:
            await cache_backend.close()

    @app.get("/", tags=["meta"])
    async def root() -> dict[str, str]:
        return {"message": "AIRecipe service is running."}

    app.include_router(recipes.router)

    return app


app = create_app()
