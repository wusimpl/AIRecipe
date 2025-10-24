"""Structured logging middleware for request lifecycle events."""

from __future__ import annotations

import logging
import time
from typing import Dict

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.types import ASGIApp


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Emit structured logs for each request with timing metadata."""

    def __init__(self, app: ASGIApp, logger_name: str = "app.request") -> None:
        super().__init__(app)
        self._logger = logging.getLogger(logger_name)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        start = time.perf_counter()
        context: Dict[str, object] = {
            "method": request.method,
            "path": request.url.path,
        }
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            context["duration_ms"] = round(duration_ms, 2)
            context["request_id"] = getattr(request.state, "request_id", None)
            self._logger.exception("request failed", extra=context)
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        context.update(
            {
                "duration_ms": round(duration_ms, 2),
                "status_code": response.status_code,
                "request_id": getattr(request.state, "request_id", None),
            }
        )
        self._logger.info("request completed", extra=context)
        return response
