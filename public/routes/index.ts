import { Router } from 'express';
import connectionRoutes from './connection.js';
import webhookRoutes from './webhooks.js';
import botRoutes from './bot.js';
import messagingRoutes from './messaging.js';
import mediaRoutes from './media.js';
import contactRoutes from './contacts.js';
import groupRoutes from './groups.js';

const router = Router();

// Mount all routes
router.use('/connection', connectionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/bot', botRoutes);
router.use('/', messagingRoutes);  // Messaging routes at root level
router.use('/', mediaRoutes);      // Media routes at root level
router.use('/contacts', contactRoutes);
router.use('/groups', groupRoutes);

export default router;
