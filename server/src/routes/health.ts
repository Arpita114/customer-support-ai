import { Router } from 'express';
import { ollamaService } from '../services/ollamaService.js';
import { vectorStore } from '../services/vectorStore.js';
import { documentService } from '../services/documentService.js';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System status
 */
router.get('/', async (_req, res) => {
  const ollamaHealthy = await ollamaService.checkHealth();
  const documentCount = await documentService.getDocumentCount();

  res.json({
    success: true,
    status: 'healthy',
    services: {
      api: 'up',
      ollama: ollamaHealthy ? 'connected' : 'disconnected',
      vectorStore: 'up'
    },
    stats: {
      documents: documentCount
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
