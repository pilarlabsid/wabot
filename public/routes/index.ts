import { Router } from 'express';
import connectionRoutes from './connection';
import webhookRoutes from './webhooks';
import botRoutes from './bot';
import messagingRoutes from './messaging';
import mediaRoutes from './media';
import contactRoutes from './contacts';
import groupRoutes from './groups';

const router = Router();

// Mount all routes
router.use('/connection', connectionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/bot', botRoutes);
router.use('/', messagingRoutes);  // Messaging routes at root level
router.use('/media', mediaRoutes);  // Media routes at /media prefix
router.use('/contacts', contactRoutes);
router.use('/groups', groupRoutes);

export default router;
