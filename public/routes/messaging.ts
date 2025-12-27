import { Router } from 'express';
import { messagingController } from '../controllers/messagingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/send-message', authenticate, messagingController.sendMessage.bind(messagingController));
router.post('/send-to-group', authenticate, messagingController.sendToGroup.bind(messagingController));
router.post('/send-reaction', authenticate, messagingController.sendReaction.bind(messagingController));
router.post('/send-list', authenticate, messagingController.sendList.bind(messagingController));
router.post('/send-reply', authenticate, messagingController.sendReply.bind(messagingController));
router.post('/send-mention', authenticate, messagingController.sendMention.bind(messagingController));
router.post('/delete-message', authenticate, messagingController.deleteMessage.bind(messagingController));
router.post('/edit-message', authenticate, messagingController.editMessage.bind(messagingController));
router.post('/send-template', authenticate, messagingController.sendTemplate.bind(messagingController));
router.post('/forward-message', authenticate, messagingController.forwardMessage.bind(messagingController));

export default router;
