import { v4 as uuidv4 } from 'uuid';
import { ollamaService } from './ollamaService.js';
import { vectorStore } from './vectorStore.js';
import { documentService } from './documentService.js';
import { logger } from '../utils/logger.js';
import type { ChatSession, ChatMessage, ChatRequest, ChatResponse, Source } from '../types/index.js';

// In-memory chat sessions (replace with Redis/DB in production)
const sessions: Map<string, ChatSession> = new Map();

const SYSTEM_PROMPT = `You are a helpful Customer Support AI Assistant. Your role is to answer user questions based ONLY on the provided company documentation and knowledge base.

Guidelines:
1. Answer questions using ONLY the information from the provided context
2. If the answer is not in the context, respond with: "I'm sorry, I don't have information about that in our knowledge base. Would you like me to escalate this to a human agent?"
3. Be concise but thorough in your responses
4. Maintain a professional, friendly tone
5. If asked about something unrelated to customer support, politely redirect to support topics
6. Cite the source document when possible
7. Do not make up information or hallucinate answers

Context from knowledge base:`;

export class ChatService {
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId } = request;
    const currentSessionId = sessionId || uuidv4();

    // Get or create session
    let session = sessions.get(currentSessionId);
    if (!session) {
      session = {
        id: currentSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      sessions.set(currentSessionId, session);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Search knowledge base
    logger.info(`🔍 Searching knowledge base for: "${message.substring(0, 50)}..."`);
    const searchResults = await vectorStore.search(message, 5);

    // Enrich sources with document names
    const sources: Source[] = [];
    for (const result of searchResults) {
      const doc = await documentService.getDocument(result.documentId);
      if (doc) {
        sources.push({
          ...result,
          documentName: doc.originalName
        });
      }
    }

    // Build context from sources
    const context = sources.length > 0
      ? sources.map((s, i) => `[Source ${i + 1} from ${s.documentName}]: ${s.chunkContent}`).join('\n\n')
      : 'No relevant documents found in the knowledge base.';

    // Build messages for LLM
    const messagesForLLM = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n${context}`
      },
      ...session.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    // Generate response
    logger.info('🤖 Generating AI response...');
    let responseContent: string;

    try {
      responseContent = await ollamaService.chat(messagesForLLM);
    } catch (error) {
      logger.error('LLM generation failed:', error);
      responseContent = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
    }

    // Add assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      sources: sources.length > 0 ? sources : undefined
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    logger.info('✅ Response generated');

    return {
      message: assistantMessage,
      sessionId: currentSessionId,
      sources: sources.length > 0 ? sources : undefined
    };
  }

  async *streamMessage(request: ChatRequest): AsyncGenerator<{ type: string; data?: any }> {
    const { message, sessionId } = request;
    const currentSessionId = sessionId || uuidv4();

    let session = sessions.get(currentSessionId);
    if (!session) {
      session = {
        id: currentSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      sessions.set(currentSessionId, session);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Search knowledge base
    yield { type: 'status', data: { status: 'searching' } };
    const searchResults = await vectorStore.search(message, 5);

    const sources: Source[] = [];
    for (const result of searchResults) {
      const doc = await documentService.getDocument(result.documentId);
      if (doc) {
        sources.push({
          ...result,
          documentName: doc.originalName
        });
      }
    }

    if (sources.length > 0) {
      yield { type: 'sources', data: { sources } };
    }

    // Build context
    const context = sources.length > 0
      ? sources.map((s, i) => `[Source ${i + 1} from ${s.documentName}]: ${s.chunkContent}`).join('\n\n')
      : 'No relevant documents found in the knowledge base.';

    const messagesForLLM = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n${context}`
      },
      ...session.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    // Stream response
    yield { type: 'status', data: { status: 'generating' } };

    let fullResponse = '';
    const messageId = uuidv4();

    try {
      for await (const chunk of ollamaService.streamChat(messagesForLLM)) {
        fullResponse += chunk;
        yield { type: 'chunk', data: { chunk, messageId } };
      }
    } catch (error) {
      logger.error('Streaming failed:', error);
      const errorMsg = "I'm sorry, I'm having trouble right now. Please try again.";
      yield { type: 'chunk', data: { chunk: errorMsg, messageId } };
      fullResponse = errorMsg;
    }

    // Save assistant message
    const assistantMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date(),
      sources: sources.length > 0 ? sources : undefined
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    yield { type: 'done', data: { messageId, sessionId: currentSessionId } };
  }

  async getSession(sessionId: string): Promise<ChatSession | undefined> {
    return sessions.get(sessionId);
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return Array.from(sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return sessions.delete(sessionId);
  }
}

export const chatService = new ChatService();
