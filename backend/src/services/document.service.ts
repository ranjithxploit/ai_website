import mammoth from 'mammoth';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import config from '../config/config';

const execAsync = promisify(exec);

/**
 * Extract text from DOCX file
 */
export const extractTextFromDocx = async (filePath: string): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error: any) {
    logger.error('Error extracting text from DOCX', { error: error.message, filePath });
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extract text from PDF file
 */
export const extractTextFromPdf = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const pages = pdfDoc.getPages();
    
    let text = '';
    for (const page of pages) {
      // Note: pdf-lib doesn't support text extraction directly
      // In production, use pdf-parse or pdfjs-dist
      // For now, we'll return a placeholder
      text += `[Page ${page.getWidth()}x${page.getHeight()}]`;
    }
    
    return text;
  } catch (error: any) {
    logger.error('Error extracting text from PDF', { error: error.message, filePath });
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Detect section placeholders in document text
 */
export const detectPlaceholders = (text: string): string[] => {
  // Match patterns like {{SECTION}}, [SECTION], {SECTION}, <<SECTION>>
  const patterns = [
    /\{\{([A-Z_]+)\}\}/g,
    /\[([A-Z_]+)\]/g,
    /\{([A-Z_]+)\}/g,
    /<<([A-Z_]+)>>/g,
  ];

  const placeholders = new Set<string>();

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      placeholders.add(match[1]);
    }
  }

  return Array.from(placeholders);
};

/**
 * Fill DOCX template with generated content
 */
export const fillDocxTemplate = async (
  templatePath: string,
  content: { [key: string]: string },
  outputPath: string
): Promise<void> => {
  try {
    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set data
    doc.setData(content);

    // Render document
    doc.render();

    // Generate output
    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buf);

    logger.info('DOCX template filled successfully', { outputPath });
  } catch (error: any) {
    logger.error('Error filling DOCX template', { error: error.message, templatePath });
    throw new Error('Failed to fill DOCX template');
  }
};

/**
 * Convert DOCX to PDF using LibreOffice
 */
export const convertDocxToPdf = async (
  docxPath: string,
  outputDir: string
): Promise<string> => {
  try {
    const command = `"${config.libreoffice.path}" --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;
    
    await execAsync(command);

    const pdfFilename = path.basename(docxPath, '.docx') + '.pdf';
    const pdfPath = path.join(outputDir, pdfFilename);

    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF conversion failed - output file not found');
    }

    logger.info('DOCX converted to PDF successfully', { pdfPath });
    return pdfPath;
  } catch (error: any) {
    logger.error('Error converting DOCX to PDF', { error: error.message, docxPath });
    throw new Error('Failed to convert DOCX to PDF. Ensure LibreOffice is installed.');
  }
};

/**
 * Estimate page count from word count
 */
export const estimatePageCount = (wordCount: number): number => {
  const wordsPerPage = 475; // Average
  return Math.ceil(wordCount / wordsPerPage);
};

/**
 * Calculate target word count for requested pages
 */
export const calculateWordCount = (pages: number): number => {
  const wordsPerPage = 475;
  return pages * wordsPerPage;
};

/**
 * Create a complete document from template and content
 */
export const createDocument = async (
  templatePath: string,
  contentMap: { [key: string]: string },
  outputFilename?: string
): Promise<{ docxPath: string; pdfPath: string }> => {
  try {
    const outputName = outputFilename || `document-${uuidv4()}`;
    const outputDir = config.upload.uploadPath;
    const docxPath = path.join(outputDir, `${outputName}.docx`);

    // Fill template
    await fillDocxTemplate(templatePath, contentMap, docxPath);

    // Convert to PDF
    const pdfPath = await convertDocxToPdf(docxPath, outputDir);

    return { docxPath, pdfPath };
  } catch (error: any) {
    logger.error('Error creating document', { error: error.message });
    throw new Error('Failed to create document');
  }
};

export default {
  extractTextFromDocx,
  extractTextFromPdf,
  detectPlaceholders,
  fillDocxTemplate,
  convertDocxToPdf,
  estimatePageCount,
  calculateWordCount,
  createDocument,
};
