"""OpenAI-compatible provider implementation."""

from __future__ import annotations

import asyncio
import json
import logging
from copy import deepcopy
from typing import Any, AsyncIterator, Dict
from urllib.parse import urlparse

import httpx

from app.llm.providers.base import ProviderSettings, RecipeLLMProvider

logger = logging.getLogger(__name__)


class OpenAILikeLLMProvider(RecipeLLMProvider):
    """Provider backed by an OpenAI-compatible chat-completions endpoint."""

    def __init__(self, settings: ProviderSettings) -> None:
        self._settings = settings
        self.name = settings.name
        self.model = settings.model
        parsed_base = urlparse(settings.api_base)
        base_path = parsed_base.path.rstrip("/")
        last_segment = base_path.rsplit("/", 1)[-1] if base_path else ""
        has_version_suffix = last_segment.startswith("v") and last_segment[1:].isdigit()
        default_path = "/chat/completions" if has_version_suffix else "/v1/chat/completions"
        self._path = settings.metadata.get("path", default_path)
        self._max_retries = max(settings.max_retries, 0)
        self._backoff = max(settings.backoff_factor, 0.0)
        self._system_prompt = settings.metadata.get(
            "system_prompt", "You are a helpful recipe assistant."
        )
        self._payload_overrides = deepcopy(settings.metadata.get("payload_overrides", {}))

        default_headers = {
            "Authorization": f"Bearer {settings.api_key}",
            "Content-Type": "application/json",
        }
        extra_headers = settings.metadata.get("headers", {})
        self._client = httpx.AsyncClient(
            base_url=settings.api_base,
            headers={**default_headers, **extra_headers},
            timeout=settings.timeout,
            proxies={},  # Disable proxy usage
            trust_env=False,  # Don't use environment proxy settings
        )

    def _build_payload(self, prompt: str) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self._system_prompt},
                {"role": "user", "content": prompt},
            ],
        }
        payload.update(deepcopy(self._payload_overrides))
        return payload


    async def generate(self, *, prompt: str) -> str:
        last_exc: Exception | None = None
        for attempt in range(self._max_retries + 1):
            try:
                response = await self._client.post(
                    self._path, json=self._build_payload(prompt)
                )
                response.raise_for_status()
                data = response.json()
                logger.debug("Provider %s raw response: %s", self.name, data)
                choices = data.get("choices", [])
                if not choices:
                    logger.error("Provider %s returned no choices: %s", self.name, data)
                    raise ValueError("provider response missing choices")  # pragma: no cover
                message = choices[0].get("message", {})
                content = message.get("content")
                if content is None:
                    logger.error("Provider %s returned None content: %s", self.name, message)
                    raise ValueError("provider response missing content")  # pragma: no cover
                if not content or not content.strip():
                    logger.error("Provider %s returned empty content: %s", self.name, repr(content))
                    raise ValueError("provider response content is empty")
                logger.debug("Provider %s content length: %d chars", self.name, len(content))
                return content
            except httpx.HTTPError as exc:
                last_exc = exc
                if attempt >= self._max_retries:
                    logger.exception("Provider request failed after retries")
                    raise
                sleep_for = self._backoff * (2**attempt)
                if sleep_for > 0:
                    await asyncio.sleep(sleep_for)

        assert last_exc is not None  # pragma: no cover - defensive
        raise last_exc

    async def generate_stream(self, *, prompt: str) -> AsyncIterator[str]:
        """Stream raw model output chunks using SSE format."""
        payload = self._build_payload(prompt)
        payload["stream"] = True

        last_exc: Exception | None = None
        for attempt in range(self._max_retries + 1):
            try:
                async with self._client.stream("POST", self._path, json=payload) as response:
                    response.raise_for_status()

                    # Buffer for incomplete lines
                    buffer = ""

                    # Use aiter_text() instead of aiter_bytes() to handle encoding automatically
                    async for text_chunk in response.aiter_text():
                        buffer += text_chunk

                        # Process complete lines
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()

                            # Skip empty lines
                            if not line:
                                continue

                            # Parse SSE format: "data: {...}"
                            if line.startswith("data: "):
                                data_str = line[6:]  # Remove "data: " prefix

                                # Check for [DONE] marker
                                if data_str == "[DONE]":
                                    logger.debug("Provider %s stream completed", self.name)
                                    return

                                try:
                                    # Parse JSON chunk
                                    data = json.loads(data_str)
                                    choices = data.get("choices", [])

                                    if choices:
                                        delta = choices[0].get("delta", {})
                                        content = delta.get("content")

                                        if content:
                                            # Stream immediately for all models
                                            yield content

                                except json.JSONDecodeError as e:
                                    logger.warning(
                                        "Provider %s failed to parse chunk: %s, error: %s",
                                        self.name,
                                        data_str,
                                        e
                                    )
                                    continue

                return  # Successful stream completion

            except httpx.HTTPError as exc:
                last_exc = exc
                if attempt >= self._max_retries:
                    logger.exception("Provider stream failed after retries")
                    raise
                sleep_for = self._backoff * (2**attempt)
                if sleep_for > 0:
                    await asyncio.sleep(sleep_for)

        assert last_exc is not None  # pragma: no cover - defensive
        raise last_exc

    async def aclose(self) -> None:
        await self._client.aclose()
