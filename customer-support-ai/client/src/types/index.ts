export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: Source[];
}

export interface Source {
  documentId: string;
  documentName: string;
  chunkContent: string;
  relevanceScore: number;
}

export interface ChatResponse {
  success: boolean;
  message: ChatMessage;
  sessionId: string;
  sources?: Source[];
}

export interface HealthStatus {
  success: boolean;
  status: string;
  services: {
    api: string;
    ollama: string;
    vectorStore: string;
  };
  stats: {
    documents: number;
  };
  timestamp: string;
}