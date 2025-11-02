import { Response, NextFunction } from 'express';
import Document from '../models/Document';
import Template from '../models/Template';
import { AuthRequest } from '../middleware/auth';
import { generateMultipleSections } from '../services/gemini.service';
import { createDocument, calculateWordCount } from '../services/document.service';
import { GenerateDocumentInput } from '../utils/validation';
import logger from '../utils/logger';
import path from 'path';

/**
 * Generate document
 */
export const generateDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { templateId, topics, requestedPages }: GenerateDocumentInput = req.body;

    // Validate template
    const template = await Template.findOne({ _id: templateId, userId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    // Create document record
    const document = await Document.create({
      userId,
      templateId,
      topics,
      requestedPages,
      status: 'processing',
    });

    // Start generation process (async)
    generateDocumentContent(document._id.toString(), template, topics, requestedPages);

    logger.info('Document generation started', {
      userId,
      documentId: document._id,
      templateId,
    });

    res.status(202).json({
      success: true,
      message: 'Document generation started',
      data: {
        documentId: document._id,
        status: 'processing',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Background task to generate document content
 */
const generateDocumentContent = async (
  documentId: string,
  template: any,
  topics: any[],
  requestedPages: number
): Promise<void> => {
  const startTime = Date.now();

  try {
    const totalWordCount = calculateWordCount(requestedPages);
    const sectionNames = template.sections.map((s: any) => s.name);

    // Generate content for each topic
    const allGeneratedContent: any[] = [];

    for (const topic of topics) {
      const results = await generateMultipleSections(
        topic.name,
        sectionNames,
        topic.style,
        totalWordCount
      );

      results.forEach((result, index) => {
        allGeneratedContent.push({
          sectionName: sectionNames[index],
          content: result.content,
          wordCount: result.wordCount,
        });
      });
    }

    // Create content map for template
    const contentMap: { [key: string]: string } = {};
    allGeneratedContent.forEach((section) => {
      contentMap[section.sectionName] = section.content;
    });

    // Generate documents
    const outputFilename = `assignment-${documentId}`;
    const { docxPath, pdfPath } = await createDocument(
      template.filePath,
      contentMap,
      outputFilename
    );

    // Update document
    await Document.findByIdAndUpdate(documentId, {
      generatedContent: allGeneratedContent,
      status: 'completed',
      filePathDocx: docxPath,
      filePathPdf: pdfPath,
      filenameDocx: path.basename(docxPath),
      filenamePdf: path.basename(pdfPath),
      completedAt: new Date(),
      'metadata.totalWordCount': allGeneratedContent.reduce(
        (sum, s) => sum + s.wordCount,
        0
      ),
      'metadata.generationTimeMs': Date.now() - startTime,
    });

    // Update template usage
    await Template.findByIdAndUpdate(template._id, {
      $inc: { 'metadata.timesUsed': 1 },
      'metadata.lastUsed': new Date(),
    });

    logger.info('Document generation completed', {
      documentId,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    logger.error('Document generation failed', {
      documentId,
      error: error.message,
    });

    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      'metadata.error': error.message,
    });
  }
};

/**
 * Get document status and preview
 */
export const getDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const document = await Document.findOne({ _id: id, userId })
      .populate('templateId', 'originalName fileType')
      .select('-filePathDocx -filePathPdf');

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download generated document
 */
export const downloadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, format } = req.params;
    const userId = req.user!.userId;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found',
      });
      return;
    }

    if (document.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: `Document is ${document.status}`,
      });
      return;
    }

    const filePath = format === 'pdf' ? document.filePathPdf : document.filePathDocx;
    const filename = format === 'pdf' ? document.filenamePdf : document.filenameDocx;

    if (!filePath || !filename) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
};

export default {
  generateDocument,
  getDocument,
  downloadDocument,
};
