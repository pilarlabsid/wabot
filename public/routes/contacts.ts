import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, contactController.getAll.bind(contactController));
router.get('/:jid', authenticate, contactController.getById.bind(contactController));
router.post('/block', authenticate, contactController.block.bind(contactController));
router.post('/unblock', authenticate, contactController.unblock.bind(contactController));
router.get('/blocked', authenticate, contactController.getBlocked.bind(contactController));
router.get('/:jid/picture', authenticate, contactController.getPicture.bind(contactController));

// Bot profile routes (under contacts for backward compatibility)
router.post('/profile/name', authenticate, contactController.updateProfileName.bind(contactController));
router.post('/profile/status', authenticate, contactController.updateProfileStatus.bind(contactController));

export default router;
