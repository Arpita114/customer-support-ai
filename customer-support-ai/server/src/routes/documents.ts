import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { documentService } from '../services/documentService.js';
import { UPLOAD_PATH, config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only PDF, DOCX, and TXT are allowed.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE }
});

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a document to the knowledge base
 *     tags: [Documents]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: PDF, DOCX, or TXT file
 *     responses:
 *       200:
 *         description: Document uploaded and processed successfully
 *       400:
 *         description: Invalid file or processing error
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info(`📤 Upload received: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await documentService.processUpload(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    if (result.success) {
      res.json({
        success: true,
        document: {
          id: result.document!.id,
          originalName: result.document!.originalName,
          mimeType: result.document!.mimeType,
          size: result.document!.size,
          chunkCount: result.document!.chunks.length,
          createdAt: result.document!.createdAt
        }
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Upload route error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List all uploaded documents
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/', async (_req, res) => {
  try {
    const documents = await documentService.getAllDocuments();
    res.json({
      success: true,
      count: documents.length,
      documents: documents.map(d => ({
        id: d.id,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        chunkCount: d.chunks.length,
        createdAt: d.createdAt
      }))
    });
  } catch (error) {
    logger.error('List documents error:', error);
    res.status(500).json({ success: false, error: 'Failed to list documents' });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await documentService.deleteDocument(req.params.id);
    if (success) {
      res.json({ success: true, message: 'Document deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Document not found' });
    }
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

export default router;
