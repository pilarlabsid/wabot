import { Router } from 'express';
import { groupController } from '../controllers/groupController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, groupController.getAll.bind(groupController));
router.get('/:groupId', authenticate, groupController.getById.bind(groupController));
router.post('/create', authenticate, groupController.create.bind(groupController));
router.post('/:groupId/add-participant', authenticate, groupController.addParticipant.bind(groupController));
router.post('/:groupId/remove-participant', authenticate, groupController.removeParticipant.bind(groupController));
router.post('/:groupId/leave', authenticate, groupController.leave.bind(groupController));
router.post('/:groupId/update-subject', authenticate, groupController.updateSubject.bind(groupController));
router.post('/:groupId/update-description', authenticate, groupController.updateDescription.bind(groupController));
router.get('/:groupId/participants', authenticate, groupController.getParticipants.bind(groupController));
router.post('/:groupId/promote-admin', authenticate, groupController.promoteAdmin.bind(groupController));
router.post('/:groupId/demote-admin', authenticate, groupController.demoteAdmin.bind(groupController));
router.post('/:groupId/settings', authenticate, groupController.updateSettings.bind(groupController));
router.get('/:groupId/invite-code', authenticate, groupController.getInviteCode.bind(groupController));
router.post('/:groupId/revoke-invite', authenticate, groupController.revokeInvite.bind(groupController));

export default router;
