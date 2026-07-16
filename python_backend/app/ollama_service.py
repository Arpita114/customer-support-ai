import httpx
import json
from typing import AsyncGenerator
from app.config import OLLAMA_BASE_URL, LLM_MODEL, EMBEDDING_MODEL, MAX_RESPONSE_TOKENS
from app.logger import logger


class OllamaService:
    def __init__(self):
        self.base_url = OLLAMA_BASE_URL
        self.llm_model = LLM_MODEL
        self.embedding_model = EMBEDDING_MODEL
        self.client = httpx.AsyncClient(timeout=120.0)

    async def check_health(self) -> bool:
        try:
            response = await self.client.get(f"{self.base_url}/api/tags", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False

    async def generate_embedding(self, text: str) -> list[float]:
        try:
            response = await self.client.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.embedding_model,
                    "prompt": text,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    async def chat(self, messages: list[dict]) -> str:
        full_response = ""
        async for chunk in self.stream_chat(messages):
            full_response += chunk
        return full_response

    async def stream_chat(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.llm_model,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "temperature": 0.7,
                        "num_ctx": 4096,
                        "num_predict": MAX_RESPONSE_TOKENS,
                    },
                },
            ) as response:
                response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_bytes():
                    buffer += chunk.decode("utf-8", errors="replace")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield content
                            if data.get("done"):
                                return
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"Chat streaming failed: {e}")
            raise


ollama_service = OllamaService()
