"""Mock LLM provider built on httpx.MockTransport."""

from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator, Callable

import httpx

from app.llm.base import RecipeLLMProvider

MockHandler = Callable[[httpx.Request], httpx.Response]


def _default_recipe() -> dict[str, object]:
    """Return a deterministic recipe matching the JSON schema."""
    return {
        "菜名": "番茄炒蛋",
        "标签": ["家常菜", "入门级"],
        "简介": "酸甜开胃的家常菜，鸡蛋蓬松滑嫩，番茄汁浓郁。",
        "难度": "入门",
        "准备时间": "10分钟",
        "烹饪时间": "8分钟",
        "总时间": "约18分钟",
        "选材": {
            "主要食材": {
                "鸡蛋": {
                    "描述": "新鲜散养鸡蛋口感更好。",
                    "tips": "轻摇无声说明新鲜。"
                },
                "番茄": {
                    "描述": "熟透番茄汁水足，味道更甜。",
                    "tips": "挑选表皮光滑、略软的番茄。"
                }
            }
        },
        "用料": {
            "主料": {
                "鸡蛋": "4个",
                "番茄": "2个（中等大小）"
            },
            "辅料": {
                "葱花": "1小勺"
            },
            "调味料": {
                "盐": "1/2小勺",
                "白胡椒": "少许",
                "糖": "1小勺"
            }
        },
        "预处理": {
            "鸡蛋打散": {
                "操作": "鸡蛋打入碗中，加入少许盐和白胡椒，充分打散起泡。",
                "tips": "筷子画圈打出细腻气泡，炒出更蓬松的蛋。"
            },
            "番茄切块": {
                "操作": "番茄去蒂，切成大块。",
                "tips": "喜欢口感细腻可去皮。"
            }
        },
        "烹饪流程": {
            "步骤顺序数组": [
                {
                    "步骤名": "炒蛋成型",
                    "操作": "热锅冷油，倒入蛋液，中大火快速翻炒至七分熟盛出。",
                    "时间": "1-2分钟",
                    "火候": "中大火",
                    "tips": "见到蛋液凝固立即盛出，保持滑嫩。"
                },
                {
                    "步骤名": "炒番茄出汁",
                    "操作": "锅中再放少许油，下葱花炒香，倒入番茄块翻炒至出汁，加入糖调味。",
                    "时间": "3分钟",
                    "火候": "中火",
                    "tips": "糖能平衡酸味，炒到番茄出汁即可。"
                },
                {
                    "步骤名": "合并收汁",
                    "操作": "倒回鸡蛋，加入剩余盐调味，翻炒均匀即可出锅。",
                    "时间": "1分钟",
                    "火候": "中火",
                    "tips": "收汁不要太干，保留少量汤汁口感更好。"
                }
            ]
        },
        "保存与食用": {
            "保存方式": {
                "冷藏": "密封冷藏一天，食用前再加热。"
            },
            "搭配建议": ["米饭", "粥"]
        },
        "其他注意事项": {
            "通用提示": ["番茄炒出汁后再下鸡蛋口感更好。"]
        },
        "版本": "1.0",
        "作者": "MockProvider",
        "创建时间": "2024-01-01T00:00:00Z"
    }


def _default_handler(_: httpx.Request) -> httpx.Response:
    """Default MockTransport handler returning a deterministic chat-completion reply."""
    content = json.dumps(_default_recipe(), ensure_ascii=False)
    payload = {
        "id": "mock-response",
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": content
                }
            }
        ]
    }
    return httpx.Response(200, json=payload)


class MockLLMProvider(RecipeLLMProvider):
    """Mock provider backed by httpx.MockTransport."""

    def __init__(
        self,
        *,
        name: str = "mock",
        model: str = "mock-recipe-generator",
        handler: MockHandler | None = None,
        base_url: str = "https://mock-llm.local",
        timeout: float = 5.0,
        path: str = "/v1/chat/completions",
    ) -> None:
        self.name = name
        self.model = model
        self._path = path
        self._transport = httpx.MockTransport(handler or _default_handler)
        self._client = httpx.AsyncClient(
            transport=self._transport,
            base_url=base_url,
            timeout=timeout,
        )

    async def generate(self, *, prompt: str) -> str:
        response = await self._client.post(
            self._path,
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful recipe assistant."},
                    {"role": "user", "content": prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def generate_stream(self, *, prompt: str) -> AsyncIterator[str]:
        """Simulate streaming by yielding content in chunks."""
        # Get the full content first
        full_content = await self.generate(prompt=prompt)

        # Simulate streaming by yielding chunks character by character
        # Group into reasonable chunks (e.g., 10 characters at a time)
        chunk_size = 10
        for i in range(0, len(full_content), chunk_size):
            chunk = full_content[i:i + chunk_size]
            yield chunk
            # Small delay to simulate network streaming
            await asyncio.sleep(0.01)

    async def aclose(self) -> None:
        await self._client.aclose()
