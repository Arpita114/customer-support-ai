import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from './logger.js';

export async function parseDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);

    switch (mimeType) {
      case 'application/pdf':
        return await parsePDF(buffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await parseDOCX(buffer);

      case 'text/plain':
      case 'text/markdown':
        return buffer.toString('utf-8');

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    logger.error('Document parsing failed:', error);
    throw error;
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    logger.error('PDF parsing failed:', error);
    throw new Error('Failed to parse PDF file');
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    logger.error('DOCX parsing failed:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + trimmed).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + trimmed;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 50);
}
