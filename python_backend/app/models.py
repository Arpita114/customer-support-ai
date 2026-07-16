from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class TextChunk:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str = ""
    content: str = ""
    start_index: int = 0
    end_index: int = 0
    section: str = ""


@dataclass
class Document:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    filename: str = ""
    original_name: str = ""
    mime_type: str = ""
    size: int = 0
    content: str = ""
    chunks: list[TextChunk] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Source:
    document_id: str
    document_name: str
    chunk_content: str
    relevance_score: float = 0.0


@dataclass
class ChatMessage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "user"
    content: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    sources: Optional[list[Source]] = None


@dataclass
class ChatSession:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    messages: list[ChatMessage] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ChatRequest:
    message: str
    session_id: Optional[str] = None


@dataclass
class ChatResponse:
    message: ChatMessage
    session_id: str
    sources: Optional[list[Source]] = None


@dataclass
class UploadResult:
    success: bool
    document: Optional[Document] = None
    error: Optional[str] = None


@dataclass
class FAQItem:
    question: str
    answer: str


@dataclass
class FAQImportRequest:
    faqs: list[FAQItem]
