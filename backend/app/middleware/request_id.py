"""Inject a request ID into request state and response headers."""

from __future__ import annotations

from typing import Callable
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.types import ASGIApp


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Ensure each request carries a stable identifier."""

    def __init__(self, app: ASGIApp, header_name: str = "X-Request-ID") -> None:
        super().__init__(app)
        self._header_name = header_name

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        request_id = request.headers.get(self._header_name, str(uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers[self._header_name] = request_id
        return response
