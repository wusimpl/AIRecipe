"""Caching abstraction with Redis, file-based, or in-memory backends."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Tuple

from app.core.config import AppSettings

logger = logging.getLogger(__name__)

try:  # pragma: no cover - optional dependency
    from redis.asyncio import Redis
except ImportError:  # pragma: no cover - optional dependency
    Redis = None  # type: ignore[assignment]


class CacheBackend(ABC):
    """Abstract cache interface."""

    @abstractmethod
    async def get(self, key: str) -> str | None:
        """Return the stored value if present."""

    @abstractmethod
    async def set(self, key: str, value: str) -> None:
        """Store a value permanently."""

    @abstractmethod
    async def incr(self, key: str, ttl: int | None = None) -> int:
        """Atomically increment a counter and return the new value."""

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Remove a key from cache."""

    async def close(self) -> None:
        """Allow graceful shutdown for subclasses."""


class InMemoryCacheBackend(CacheBackend):
    """Simple asyncio-friendly in-memory cache."""

    def __init__(self) -> None:
        self._store: Dict[str, Tuple[str, float | None]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> str | None:
        async with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            value, expires_at = item
            if expires_at is not None and expires_at <= time.monotonic():
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: str) -> None:
        async with self._lock:
            self._store[key] = (value, None)
            logger.debug(
                "内存缓存写入 - 键: %s, 数据大小: %d 字节",
                key,
                len(value)
            )

    async def incr(self, key: str, ttl: int | None = None) -> int:
        async with self._lock:
            value, expires_at = self._store.get(key, ("0", None))
            try:
                counter = int(value)
            except ValueError:
                counter = 0
            counter += 1
            expires_at = (
                time.monotonic() + ttl if ttl is not None and ttl > 0 else expires_at
            )
            self._store[key] = (str(counter), expires_at)
            return counter

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)


class RedisCacheBackend(CacheBackend):
    """Redis-backed cache implementation."""

    def __init__(self, url: str) -> None:
        if Redis is None:
            raise RuntimeError("redis package not installed")
        self._client = Redis.from_url(url, decode_responses=True)

    async def get(self, key: str) -> str | None:
        return await self._client.get(key)

    async def set(self, key: str, value: str) -> None:
        await self._client.set(key, value)
        logger.debug(
            "Redis 缓存写入 - 键: %s, 数据大小: %d 字节",
            key,
            len(value)
        )

    async def incr(self, key: str, ttl: int | None = None) -> int:
        value = await self._client.incr(key)
        if ttl is not None and ttl > 0:
            await self._client.expire(key, ttl)
        return int(value)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def close(self) -> None:
        await self._client.close()




_CACHE_BACKEND: CacheBackend | None = None


async def init_cache_backend(settings: AppSettings) -> CacheBackend:
    """Initialise the cache backend based on settings."""
    global _CACHE_BACKEND
    if settings.cache_backend == "redis" and settings.redis_url:
        backend = RedisCacheBackend(settings.redis_url)
        logger.info("Initialised Redis cache at %s", settings.redis_url)
    else:
        backend = InMemoryCacheBackend()
        logger.info("Using in-memory cache backend")
    _CACHE_BACKEND = backend
    return backend


def get_cache_backend() -> CacheBackend:
    """Return the configured cache backend."""
    if _CACHE_BACKEND is None:
        raise RuntimeError("cache backend not initialised")
    return _CACHE_BACKEND
