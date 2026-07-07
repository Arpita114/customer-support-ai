import * as lancedb from 'lancedb';
import { VECTOR_DB_FULL_PATH } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { ollamaService } from './ollamaService.js';
import type { TextChunk, Source } from '../types/index.js';

interface VectorRecord {
  id: string;
  document_id: string;
  content: string;
  start_index: number;
  end_index: number;
  vector: number[];
}

export class VectorStore {
  private db: any;
  private table: any;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.db = await lancedb.connect(VECTOR_DB_FULL_PATH);

      // Try to open existing table
      try {
        this.table = await this.db.openTable('documents');
        logger.info('✅ Vector store loaded from existing data');
      } catch {
        // Create new table with schema
        const sampleData: VectorRecord[] = [{
          id: 'sample',
          document_id: 'sample',
          content: 'sample',
          start_index: 0,
          end_index: 0,
          vector: new Array(768).fill(0)
        }];

        this.table = await this.db.createTable('documents', sampleData);
        // Remove sample
        await this.table.delete("id = 'sample'");
        logger.info('✅ Vector store created');
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Vector store initialization failed:', error);
      throw error;
    }
  }

  async addChunks(chunks: TextChunk[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    const records: VectorRecord[] = [];

    for (const chunk of chunks) {
      try {
        const embedding = await ollamaService.generateEmbedding(chunk.content);

        records.push({
          id: chunk.id,
          document_id: chunk.documentId,
          content: chunk.content,
          start_index: chunk.metadata.startIndex,
          end_index: chunk.metadata.endIndex,
          vector: embedding
        });
      } catch (error) {
        logger.error(`Failed to embed chunk ${chunk.id}:`, error);
      }
    }

    if (records.length > 0) {
      await this.table.add(records);
      logger.info(`📥 Added ${records.length} chunks to vector store`);
    }
  }

  async search(query: string, topK: number = 5): Promise<Source[]> {
    if (!this.initialized) await this.initialize();

    try {
      const queryEmbedding = await ollamaService.generateEmbedding(query);

      const results = await this.table
        .search(queryEmbedding)
        .limit(topK)
        .toArray();

      return results.map((r: any) => ({
        documentId: r.document_id,
        documentName: r.document_id, // Will be enriched by caller
        chunkContent: r.content,
        relevanceScore: r._distance ? 1 - r._distance : 0
      }));
    } catch (error) {
      logger.error('Vector search failed:', error);
      return [];
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await this.table.delete(`document_id = '${documentId}'`);
    logger.info(`🗑️ Deleted chunks for document ${documentId}`);
  }

  async getAllDocumentIds(): Promise<string[]> {
    if (!this.initialized) await this.initialize();
    const results = await this.table.query().toArray();
    const ids = [...new Set(results.map((r: any) => r.document_id))];
    return ids;
  }
}

export const vectorStore = new VectorStore();
