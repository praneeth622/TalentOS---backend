import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Only accept PDF files — reject everything else at the multer level
 */
const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are accepted', 400));
  }
};

/**
 * Multer instance configured for in-memory PDF uploads
 * No disk writes — buffer kept in RAM for immediate Gemini processing
 * Max size: 5 MB
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

export { upload };
