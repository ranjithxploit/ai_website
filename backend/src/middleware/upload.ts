import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';
import { Request } from 'express';

// Ensure upload directory exists
const uploadDir = config.upload.uploadPath;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - only accept PDF and DOCX
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimes = config.upload.allowedTypes;
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF and DOCX files are allowed.'
      ) as any
    );
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB default
    files: 1, // Only one file at a time
  },
  fileFilter,
});

/**
 * Helper to delete uploaded file
 */
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Helper to clean up old files (can be used in a cron job)
 */
export const cleanupOldFiles = (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void => {
  const now = Date.now();
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading upload directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }

        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting old file:', err);
            }
          });
        }
      });
    });
  });
};

export default { upload, deleteFile, cleanupOldFiles };
