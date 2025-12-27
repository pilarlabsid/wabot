import { Router } from 'express';
import { webhookController } from '../controllers/webhookController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/configure', authenticate, webhookController.configure.bind(webhookController));
router.get('/status', authenticate, webhookController.getStatus.bind(webhookController));
router.post('/disable', authenticate, webhookController.disable.bind(webhookController));
router.post('/enable', authenticate, webhookController.enable.bind(webhookController));
router.post('/test', authenticate, webhookController.test.bind(webhookController));

export default router;
