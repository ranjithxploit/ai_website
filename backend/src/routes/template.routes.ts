import { Router } from 'express';
import {
  uploadTemplate,
  getTemplates,
  getTemplate,
  deleteTemplate,
} from '../controllers/template.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { templateIdSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/templates/upload
 * @desc    Upload assignment template
 * @access  Private
 */
router.post('/upload', upload.single('template'), uploadTemplate);

/**
 * @route   GET /api/templates
 * @desc    Get all user templates
 * @access  Private
 */
router.get('/', getTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    Get single template
 * @access  Private
 */
router.get('/:id', validate(templateIdSchema), getTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/:id', validate(templateIdSchema), deleteTemplate);

export default router;
