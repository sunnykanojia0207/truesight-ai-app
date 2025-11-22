import { Router } from 'express';
import { upload } from '../config/multer.js';
import { uploadImage, uploadVideo } from '../controllers/uploadController.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/upload/image
 * Upload an image file for analysis
 */
router.post('/image', uploadRateLimiter, upload.single('file'), uploadImage);

/**
 * POST /api/upload/video
 * Upload a video file for analysis
 */
router.post('/video', uploadRateLimiter, upload.single('file'), uploadVideo);

export default router;
