import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// URL-based sending (existing)
router.post('/send-image', authenticate, mediaController.sendImage.bind(mediaController));
router.post('/send-video', authenticate, mediaController.sendVideo.bind(mediaController));
router.post('/send-audio', authenticate, mediaController.sendAudio.bind(mediaController));
router.post('/send-document', authenticate, mediaController.sendDocument.bind(mediaController));
router.post('/send-sticker', authenticate, mediaController.sendSticker.bind(mediaController));
router.post('/send-location', authenticate, mediaController.sendLocation.bind(mediaController));
router.post('/send-contact', authenticate, mediaController.sendContact.bind(mediaController));

// File upload-based sending (new)
router.post('/upload-image', authenticate, upload.single('file'), mediaController.uploadAndSendImage.bind(mediaController));
router.post('/upload-video', authenticate, upload.single('file'), mediaController.uploadAndSendVideo.bind(mediaController));
router.post('/upload-audio', authenticate, upload.single('file'), mediaController.uploadAndSendAudio.bind(mediaController));
router.post('/upload-document', authenticate, upload.single('file'), mediaController.uploadAndSendDocument.bind(mediaController));
router.post('/upload-sticker', authenticate, upload.single('file'), mediaController.uploadAndSendSticker.bind(mediaController));

export default router;
