import { Response, NextFunction } from 'express';
import Document from '../models/Document';
import { AuthRequest } from '../middleware/auth';

/**
 * Get user generation history
 */
export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const documents = await Document.find({ userId })
      .populate('templateId', 'originalName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePathDocx -filePathPdf -generatedContent');

    const total = await Document.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const stats = await Document.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDocuments = await Document.countDocuments({ userId });
    const totalWords = await Document.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$metadata.totalWordCount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDocuments,
        totalWords: totalWords[0]?.total || 0,
        byStatus: stats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getHistory,
  getStats,
};
