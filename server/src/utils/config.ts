import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  LLM_MODEL: z.string().default('llama3.2'),
  EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  VECTOR_DB_PATH: z.string().default('./data/vectors.lance'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

export const UPLOAD_PATH = path.resolve(process.cwd(), config.UPLOAD_DIR);
export const VECTOR_DB_FULL_PATH = path.resolve(process.cwd(), config.VECTOR_DB_PATH);
