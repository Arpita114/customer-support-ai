import uuid
from datetime import datetime
from app.config import MAX_CONTEXT_MESSAGES
from app.models import ChatSession, ChatMessage, ChatRequest, ChatResponse, Source
from app.ollama_service import ollama_service
from app.vector_store import vector_store
from app.document_service import document_service
from app.logger import logger

NO_INFORMATION_RESPONSE = "I'm sorry, I don't have information about that in our knowledge base. Would you like me to escalate this to a human agent?"

SYSTEM_PROMPT = f"""You are a helpful Customer Support AI Assistant. Your role is to answer user questions based ONLY on the provided company documentation and knowledge base.

Guidelines:
1. Answer questions using ONLY the information from the provided context
2. If the answer is not in the context, respond with: "{NO_INFORMATION_RESPONSE}"
3. Be concise but thorough in your responses
4. Maintain a professional, friendly tone
5. If asked about something unrelated to customer support, politely redirect to support topics
6. Cite the source document when possible
7. Do not make up information or hallucinate answers

Context from knowledge base:"""


class ChatService:
    def __init__(self):
        self.sessions: dict[str, ChatSession] = {}

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        message = request.message
        session_id = request.session_id or str(uuid.uuid4())

        session = self.sessions.get(session_id)
        if not session:
            session = ChatSession(id=session_id)
            self.sessions[session_id] = session

        user_message = ChatMessage(role="user", content=message)
        session.messages.append(user_message)

        logger.info(f"Searching knowledge base for: \"{message[:50]}...\"")
        search_results = await vector_store.search(message, 5)

        sources: list[Source] = []
        for result in search_results:
            doc = await document_service.get_document(result.document_id)
            if doc:
                result.document_name = doc.original_name
                sources.append(result)

        if not sources:
            logger.info("No relevant sources found - returning escalation message")
            assistant_message = ChatMessage(
                role="assistant",
                content=NO_INFORMATION_RESPONSE,
                sources=None,
            )
            session.messages.append(assistant_message)
            session.updated_at = datetime.utcnow()
            return ChatResponse(
                message=assistant_message,
                session_id=session_id,
                sources=None,
            )

        context = "\n\n".join(
            f"[Source {i + 1} from {s.document_name}]: {s.chunk_content}"
            for i, s in enumerate(sources)
        )

        messages_for_llm = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context}"},
        ]

        for msg in session.messages[-MAX_CONTEXT_MESSAGES:]:
            messages_for_llm.append({"role": msg.role, "content": msg.content})

        logger.info("Generating AI response...")
        try:
            response_content = await ollama_service.chat(messages_for_llm)
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            response_content = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."

        assistant_message = ChatMessage(
            role="assistant",
            content=response_content,
            sources=sources if sources else None,
        )
        session.messages.append(assistant_message)
        session.updated_at = datetime.utcnow()

        logger.info("Response generated")

        return ChatResponse(
            message=assistant_message,
            session_id=session_id,
            sources=sources if sources else None,
        )

    async def stream_message(self, request: ChatRequest):
        message = request.message
        session_id = request.session_id or str(uuid.uuid4())

        session = self.sessions.get(session_id)
        if not session:
            session = ChatSession(id=session_id)
            self.sessions[session_id] = session

        user_message = ChatMessage(role="user", content=message)
        session.messages.append(user_message)

        yield {"type": "status", "data": {"status": "searching"}}

        search_results = await vector_store.search(message, 5)

        sources: list[Source] = []
        for result in search_results:
            doc = await document_service.get_document(result.document_id)
            if doc:
                result.document_name = doc.original_name
                sources.append(result)

        if sources:
            yield {"type": "sources", "data": {"sources": [s.model_dump() for s in sources]}}

        if not sources:
            logger.info("No relevant sources found - returning escalation message")
            yield {"type": "done", "data": {"message_id": str(uuid.uuid4()), "session_id": session_id, "content": NO_INFORMATION_RESPONSE}}
            assistant_message = ChatMessage(
                id=str(uuid.uuid4()),
                role="assistant",
                content=NO_INFORMATION_RESPONSE,
                sources=None,
            )
            session.messages.append(assistant_message)
            session.updated_at = datetime.utcnow()
            return

        context = "\n\n".join(
            f"[Source {i + 1} from {s.document_name}]: {s.chunk_content}"
            for i, s in enumerate(sources)
        )

        messages_for_llm = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context}"},
        ]
        for msg in session.messages[-MAX_CONTEXT_MESSAGES:]:
            messages_for_llm.append({"role": msg.role, "content": msg.content})

        yield {"type": "status", "data": {"status": "generating"}}

        full_response = ""
        message_id = str(uuid.uuid4())

        try:
            async for chunk in ollama_service.stream_chat(messages_for_llm):
                full_response += chunk
                yield {"type": "chunk", "data": {"chunk": chunk, "message_id": message_id}}
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            error_msg = "I'm sorry, I'm having trouble right now. Please try again."
            yield {"type": "chunk", "data": {"chunk": error_msg, "message_id": message_id}}
            full_response = error_msg

        assistant_message = ChatMessage(
            id=message_id,
            role="assistant",
            content=full_response,
            sources=sources if sources else None,
        )
        session.messages.append(assistant_message)
        session.updated_at = datetime.utcnow()

        yield {"type": "done", "data": {"message_id": message_id, "session_id": session_id}}

    async def get_session(self, session_id: str) -> ChatSession | None:
        return self.sessions.get(session_id)

    async def get_all_sessions(self) -> list[ChatSession]:
        sessions = list(self.sessions.values())
        sessions.sort(key=lambda s: s.updated_at, reverse=True)
        return sessions

    async def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False


chat_service = ChatService()
