import { Router } from 'express';
import { botController } from '../controllers/botController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/info', authenticate, botController.getInfo.bind(botController));
router.get('/status', authenticate, botController.getStatus.bind(botController));
router.get('/stats', authenticate, botController.getStats.bind(botController));

export default router;
