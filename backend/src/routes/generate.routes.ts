import { Router } from 'express';
import {
  generateDocument,
  getDocument,
  downloadDocument,
} from '../controllers/generate.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generationLimiter } from '../middleware/rateLimiter';
import {
  generateDocumentSchema,
  documentIdSchema,
  downloadFormatSchema,
} from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/generate
 * @desc    Generate document content
 * @access  Private
 */
router.post(
  '/',
  generationLimiter,
  validate(generateDocumentSchema),
  generateDocument
);

/**
 * @route   GET /api/generate/:id
 * @desc    Get document status and preview
 * @access  Private
 */
router.get('/:id', validate(documentIdSchema), getDocument);

/**
 * @route   GET /api/generate/:id/download/:format
 * @desc    Download generated document (docx or pdf)
 * @access  Private
 */
router.get('/:id/download/:format', validate(downloadFormatSchema), downloadDocument);

export default router;
