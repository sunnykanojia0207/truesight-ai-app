import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFilename } from '../utils/fileValidation.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const filename = `${uniqueId}-${name}${ext}`;
    cb(null, filename);
  },
});

// File filter (basic check, detailed validation happens after upload)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow all files through, we'll validate with magic bytes after upload
  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be validated per type)
    files: 1, // Only one file at a time
  },
});
