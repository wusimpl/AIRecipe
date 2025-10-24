"""Prompt loader backed by the shared cache interface."""

from __future__ import annotations

import asyncio
from pathlib import Path

from app.core.cache import get_cache_backend

_PROMPT_LOCK = asyncio.Lock()
_LOCAL_CACHE: dict[str, str] = {}


async def load_prompt(path: str | Path) -> str:
    """Load a prompt file and cache the result."""
    target = Path(path)
    if not target.exists():
        raise FileNotFoundError(f"prompt file not found: {target}")

    cache_key = f"prompt:{target.resolve()}"
    try:
        backend = get_cache_backend()
    except RuntimeError:
        backend = None
    else:
        cached = await backend.get(cache_key)
        if cached is not None:
            return cached

    async with _PROMPT_LOCK:
        local_cached = _LOCAL_CACHE.get(cache_key)
        if local_cached is not None:
            return local_cached

        content = target.read_text(encoding="utf-8")
        _LOCAL_CACHE[cache_key] = content
        if backend is not None:
            await backend.set(cache_key, content)
        return content


async def clear_prompt_cache() -> None:
    """Reset both local and shared caches."""
    keys = list(_LOCAL_CACHE.keys())
    _LOCAL_CACHE.clear()
    try:
        backend = get_cache_backend()
    except RuntimeError:  # pragma: no cover - only during tests
        return
    for key in keys:
        await backend.delete(key)
