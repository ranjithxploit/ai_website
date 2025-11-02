import { Router } from 'express';
import { getHistory, getStats } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/history
 * @desc    Get user generation history
 * @access  Private
 */
router.get('/history', validate(paginationSchema), getHistory);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', getStats);

export default router;
