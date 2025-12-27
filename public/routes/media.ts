import { Router } from 'express';
import { mediaController } from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/send-image', authenticate, mediaController.sendImage.bind(mediaController));
router.post('/send-video', authenticate, mediaController.sendVideo.bind(mediaController));
router.post('/send-audio', authenticate, mediaController.sendAudio.bind(mediaController));
router.post('/send-document', authenticate, mediaController.sendDocument.bind(mediaController));
router.post('/send-sticker', authenticate, mediaController.sendSticker.bind(mediaController));
router.post('/send-location', authenticate, mediaController.sendLocation.bind(mediaController));
router.post('/send-contact', authenticate, mediaController.sendContact.bind(mediaController));

export default router;
