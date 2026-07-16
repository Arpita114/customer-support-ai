import { Router } from 'express';
import { chatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to the AI assistant
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    logger.info(`💬 Chat message received: "${message.substring(0, 50)}..."`);

    const response = await chatService.processMessage({ message: message.trim(), sessionId });

    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    logger.error('Chat route error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat processing failed'
    });
  }
});

/**
 * @swagger
 * /api/chat/stream:
 *   post:
 *     summary: Stream AI response (Server-Sent Events)
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid message is required'
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    logger.info(`💬 Streaming chat: "${message.substring(0, 50)}..."`);

    for await (const event of chatService.streamMessage({
      message: message.trim(),
      sessionId
    })) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Stream chat error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { error: 'Streaming failed' } })}\n\n`);
    res.end();
  }
});

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: List all chat sessions
 *     tags: [Chat]
 */
router.get('/sessions', async (_req, res) => {
  try {
    const sessions = await chatService.getAllSessions();
    res.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (error) {
    logger.error('List sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to list sessions' });
  }
});

/**
 * @swagger
 * /api/chat/sessions/{id}:
 *   get:
 *     summary: Get chat session details
 *     tags: [Chat]
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await chatService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Failed to get session' });
  }
});

export default router;
