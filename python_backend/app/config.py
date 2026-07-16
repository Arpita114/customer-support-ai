import os
from dotenv import load_dotenv
import pathlib

load_dotenv()

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
USE_OPENAI_FALLBACK = os.getenv("USE_OPENAI_FALLBACK", "false").lower() == "true"

VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", str(BASE_DIR / "data" / "vectors"))

UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))

MAX_RESPONSE_TOKENS = int(os.getenv("MAX_RESPONSE_TOKENS", "256"))
MAX_CONTEXT_MESSAGES = int(os.getenv("MAX_CONTEXT_MESSAGES", "10"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VECTOR_DB_PATH) if "." in os.path.basename(VECTOR_DB_PATH) else VECTOR_DB_PATH, exist_ok=True)
