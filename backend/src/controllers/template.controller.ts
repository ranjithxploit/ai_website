import { Response, NextFunction } from 'express';
import Template from '../models/Template';
import { AuthRequest } from '../middleware/auth';
import { deleteFile } from '../middleware/upload';
import {
  extractTextFromDocx,
  extractTextFromPdf,
  detectPlaceholders,
  estimatePageCount,
} from '../services/document.service';
import logger from '../utils/logger';
import path from 'path';

/**
 * Upload template
 */
export const uploadTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { file } = req;
    const userId = req.user!.userId;

    // Extract text based on file type
    let extractedText = '';
    const fileType = file.mimetype.includes('pdf') ? 'pdf' : 'docx';

    if (fileType === 'docx') {
      extractedText = await extractTextFromDocx(file.path);
    } else {
      extractedText = await extractTextFromPdf(file.path);
    }

    // Detect placeholders
    const placeholders = detectPlaceholders(extractedText);

    if (placeholders.length === 0) {
      // Clean up uploaded file
      deleteFile(file.path);
      
      res.status(400).json({
        success: false,
        message: 'No section placeholders detected in template. Use {{SECTION}} format.',
      });
      return;
    }

    // Estimate page count
    const wordCount = extractedText.split(/\s+/).length;
    const pageCount = estimatePageCount(wordCount);

    // Create sections array
    const sections = placeholders.map((placeholder) => ({
      name: placeholder,
      placeholder: `{{${placeholder}}}`,
      required: true,
    }));

    // Save template to database
    const template = await Template.create({
      userId,
      filename: file.filename,
      originalName: file.originalname,
      fileType,
      filePath: file.path,
      fileSize: file.size,
      sections,
      pageCount,
    });

    logger.info('Template uploaded successfully', {
      userId,
      templateId: template._id,
      filename: file.originalname,
    });

    res.status(201).json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        template: {
          id: template._id,
          originalName: template.originalName,
          fileType: template.fileType,
          sections: template.sections,
          pageCount: template.pageCount,
          createdAt: template.createdAt,
        },
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

/**
 * Get all user templates
 */
export const getTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    const templates = await Template.find({ userId })
      .sort({ createdAt: -1 })
      .select('-filePath');

    res.status(200).json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single template
 */
export const getTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const template = await Template.findOne({ _id: id, userId }).select('-filePath');

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const template = await Template.findOne({ _id: id, userId });

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    // Delete file from filesystem
    deleteFile(template.filePath);

    // Delete from database
    await template.deleteOne();

    logger.info('Template deleted', {
      userId,
      templateId: template._id,
    });

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadTemplate,
  getTemplates,
  getTemplate,
  deleteTemplate,
};
