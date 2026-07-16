export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  chunks: TextChunk[];
  createdAt: Date;
}

export interface TextChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  startIndex: number;
  endIndex: number;
  pageNumber?: number;
  section?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export interface Source {
  documentId: string;
  documentName: string;
  chunkContent: string;
  relevanceScore: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface UploadResult {
  success: boolean;
  document?: Document;
  error?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  sources?: Source[];
}
