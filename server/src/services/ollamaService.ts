import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { OllamaResponse, OllamaEmbeddingResponse } from '../types/index.js';

export class OllamaService {
  private baseUrl: string;
  private llmModel: string;
  private embeddingModel: string;

  constructor() {
    this.baseUrl = config.OLLAMA_BASE_URL;
    this.llmModel = config.LLM_MODEL;
    this.embeddingModel = config.EMBEDDING_MODEL;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama embedding error: ${response.status}`);
      }

      const data = await response.json() as OllamaEmbeddingResponse;
      return data.embedding;
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      throw error;
    }
  }

  async *streamChat(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmModel,
          messages,
          stream: true,
          options: {
            temperature: 0.7,
            num_ctx: 4096
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama chat error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.message?.content) {
              yield chunk.message.content;
            }
            if (chunk.done) return;
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      logger.error('Chat streaming failed:', error);
      throw error;
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    let fullResponse = '';
    for await (const chunk of this.streamChat(messages)) {
      fullResponse += chunk;
    }
    return fullResponse;
  }
}

export const ollamaService = new OllamaService();
