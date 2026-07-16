import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { parseDocument, chunkText } from '../utils/documentParser.js';
import { vectorStore } from './vectorStore.js';
import { UPLOAD_PATH } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { Document, TextChunk, UploadResult } from '../types/index.js';

// In-memory store (replace with DB in production)
const documents: Map<string, Document> = new Map();

export class DocumentService {
  async processUpload(
    filePath: string,
    originalName: string,
    mimeType: string,
    size: number
  ): Promise<UploadResult> {
    try {
      const id = uuidv4();

      // Parse document content
      logger.info(`📄 Parsing document: ${originalName}`);
      const content = await parseDocument(filePath, mimeType);

      if (!content || content.trim().length < 50) {
        await fs.unlink(filePath);
        return {
          success: false,
          error: 'Document contains insufficient text content'
        };
      }

      // Chunk the content
      const chunks = chunkText(content, 800, 150);
      const textChunks: TextChunk[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        documentId: id,
        content: chunk,
        metadata: {
          startIndex: index * 800,
          endIndex: index * 800 + chunk.length,
          section: `chunk-${index + 1}`
        }
      }));

      // Create document record
      const document: Document = {
        id,
        filename: path.basename(filePath),
        originalName,
        mimeType,
        size,
        content: content.substring(0, 10000), // Store preview
        chunks: textChunks,
        createdAt: new Date()
      };

      // Store in vector DB
      logger.info(`🔤 Generating embeddings for ${textChunks.length} chunks...`);
      await vectorStore.addChunks(textChunks);

      // Save to memory store
      documents.set(id, document);

      logger.info(`✅ Document processed: ${originalName} (${textChunks.length} chunks)`);

      return { success: true, document };
    } catch (error) {
      logger.error('Document processing failed:', error);
      // Clean up uploaded file
      try { await fs.unlink(filePath); } catch {}
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(documents.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return documents.get(id);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = documents.get(id);
    if (!doc) return false;

    try {
      // Delete from vector store
      await vectorStore.deleteByDocumentId(id);

      // Delete file
      const filePath = path.join(UPLOAD_PATH, doc.filename);
      await fs.unlink(filePath).catch(() => {});

      // Remove from memory
      documents.delete(id);

      logger.info(`🗑️ Deleted document: ${doc.originalName}`);
      return true;
    } catch (error) {
      logger.error('Document deletion failed:', error);
      return false;
    }
  }

  async getDocumentCount(): Promise<number> {
    return documents.size;
  }
}

export const documentService = new DocumentService();
