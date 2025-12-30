import { Router } from 'express';
import { connectionController } from '../controllers/connectionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/status', authenticate, connectionController.getStatus.bind(connectionController));
router.get('/qr', authenticate, connectionController.getQR.bind(connectionController));
router.post('/request-pairing', authenticate, connectionController.requestPairing.bind(connectionController));
router.get('/pairing-code', authenticate, connectionController.getPairingCode.bind(connectionController));
router.post('/refresh-profile', authenticate, connectionController.refreshProfile.bind(connectionController));
router.post('/disconnect', authenticate, connectionController.disconnect.bind(connectionController));
router.post('/reconnect', authenticate, connectionController.reconnect.bind(connectionController));

export default router;