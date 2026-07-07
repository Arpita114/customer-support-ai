import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { vectorStore } from './services/vectorStore.js';

import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'development' ? '*' : undefined,
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer Support AI API',
      version: '1.0.0',
      description: 'AI-powered customer support assistant API',
      contact: {
        name: 'Arpita Gupta'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Customer Support AI API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs',
    health: '/api/health'
  });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Initialize vector store
    logger.info('🔌 Initializing vector store...');
    await vectorStore.initialize();
    logger.info('✅ Vector store ready');

    // Check Ollama
    const { ollamaService } = await import('./services/ollamaService.js');
    const ollamaHealthy = await ollamaService.checkHealth();
    if (ollamaHealthy) {
      logger.info('✅ Ollama is connected');
    } else {
      logger.warn('⚠️ Ollama is not running. Please start it with: ollama serve');
      logger.info('   Then pull models: ollama pull llama3.2 && ollama pull nomic-embed-text');
    }

    app.listen(config.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${config.PORT}`);
      logger.info(`📚 API Docs: http://localhost:${config.PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
