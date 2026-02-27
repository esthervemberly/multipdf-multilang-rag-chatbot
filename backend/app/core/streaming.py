import json
from typing import AsyncGenerator


async def sse_event(data: dict) -> str:
    """Format a dict as an SSE event string."""
    return f"data: {json.dumps(data)}\n\n"


async def create_token_event(content: str) -> str:
    return await sse_event({"type": "token", "content": content})


async def create_citations_event(sources: list[dict]) -> str:
    return await sse_event({"type": "citations", "sources": sources})


async def create_done_event() -> str:
    return await sse_event({"type": "done"})


async def create_error_event(message: str) -> str:
    return await sse_event({"type": "error", "content": message})
