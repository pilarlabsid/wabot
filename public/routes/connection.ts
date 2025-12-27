import { Router } from 'express';
import { connectionController } from '../controllers/connectionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/status', authenticate, connectionController.getStatus.bind(connectionController));
router.get('/qr', authenticate, connectionController.getQR.bind(connectionController));
router.post('/pairing', authenticate, connectionController.requestPairing.bind(connectionController));
router.get('/pairing', authenticate, connectionController.getPairingCode.bind(connectionController));
router.post('/disconnect', authenticate, connectionController.disconnect.bind(connectionController));

export default router;
