import { Request, Response } from 'express';
import { botService } from '../services/botService';
import { logger } from '../config/logger';

export class GroupController {
    async getAll(req: Request, res: Response) {
        try {
            const groups = await botService.bot.getGroups();
            logger.info('Groups retrieved successfully');
            res.status(200).json({
                success: true,
                data: groups,
                count: groups.length
            });
        } catch (error: any) {
            logger.error(`Failed to get groups: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        const { groupId } = req.params;

        try {
            const groupInfo = await botService.bot.getGroupInfo(groupId);
            logger.info(`Group info retrieved for ${groupId}`);
            res.status(200).json({ success: true, data: groupInfo });
        } catch (error: any) {
            logger.error(`Failed to get group info: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req: Request, res: Response) {
        const { subject, participants } = req.body;

        if (!subject || !participants || !Array.isArray(participants)) {
            return res.status(400).json({
                error: 'subject and participants (array) are required'
            });
        }

        try {
            const result = await botService.bot.createGroup(subject, participants);
            logger.info(`Group created: ${subject}`);
            res.status(200).json({
                success: true,
                message: 'Group created successfully',
                data: result
            });
        } catch (error: any) {
            logger.error(`Failed to create group: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async addParticipant(req: Request, res: Response) {
        const { groupId } = req.params;
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'participants (array) is required' });
        }

        try {
            await botService.bot.addParticipant(groupId, participants);
            logger.info(`Participants added to group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Participants added successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to add participants: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async removeParticipant(req: Request, res: Response) {
        const { groupId } = req.params;
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'participants (array) is required' });
        }

        try {
            await botService.bot.removeParticipant(groupId, participants);
            logger.info(`Participants removed from group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Participants removed successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to remove participants: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async leave(req: Request, res: Response) {
        const { groupId } = req.params;

        try {
            await botService.bot.leaveGroup(groupId);
            logger.info(`Left group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Left group successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to leave group: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateSubject(req: Request, res: Response) {
        const { groupId } = req.params;
        const { subject } = req.body;

        if (!subject) {
            return res.status(400).json({ error: 'subject is required' });
        }

        try {
            await botService.bot.updateGroupSubject(groupId, subject);
            logger.info(`Group subject updated for ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Group subject updated successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to update group subject: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateDescription(req: Request, res: Response) {
        const { groupId } = req.params;
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'description is required' });
        }

        try {
            await botService.bot.updateGroupDescription(groupId, description);
            logger.info(`Group description updated for ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Group description updated successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to update group description: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getParticipants(req: Request, res: Response) {
        const { groupId } = req.params;

        try {
            const participants = await botService.bot.getGroupParticipants(groupId);
            logger.info(`Participants retrieved for group ${groupId}`);
            res.status(200).json({
                success: true,
                data: participants,
                count: participants.length
            });
        } catch (error: any) {
            logger.error(`Failed to get participants: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async promoteAdmin(req: Request, res: Response) {
        const { groupId } = req.params;
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'participants (array) is required' });
        }

        try {
            await botService.bot.promoteToAdmin(groupId, participants);
            logger.info(`Participants promoted to admin in group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Participants promoted to admin successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to promote to admin: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async demoteAdmin(req: Request, res: Response) {
        const { groupId } = req.params;
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'participants (array) is required' });
        }

        try {
            await botService.bot.demoteAdmin(groupId, participants);
            logger.info(`Admins demoted in group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Admins demoted successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to demote admin: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateSettings(req: Request, res: Response) {
        const { groupId } = req.params;
        const { setting } = req.body;

        if (!setting || !['announcement', 'not_announcement'].includes(setting)) {
            return res.status(400).json({
                error: 'setting must be "announcement" or "not_announcement"'
            });
        }

        try {
            await botService.bot.updateGroupSettings(groupId, setting);
            logger.info(`Group settings updated for ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Group settings updated successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to update group settings: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getInviteCode(req: Request, res: Response) {
        const { groupId } = req.params;

        try {
            const inviteCode = await botService.bot.getGroupInviteCode(groupId);
            logger.info(`Invite code retrieved for group ${groupId}`);
            res.status(200).json({
                success: true,
                data: {
                    inviteCode,
                    inviteLink: `https://chat.whatsapp.com/${inviteCode}`
                }
            });
        } catch (error: any) {
            logger.error(`Failed to get invite code: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async revokeInvite(req: Request, res: Response) {
        const { groupId } = req.params;

        try {
            const newInviteCode = await botService.bot.revokeGroupInviteCode(groupId);
            logger.info(`Invite code revoked for group ${groupId}`);
            res.status(200).json({
                success: true,
                message: 'Invite code revoked successfully',
                data: {
                    inviteCode: newInviteCode,
                    inviteLink: `https://chat.whatsapp.com/${newInviteCode}`
                }
            });
        } catch (error: any) {
            logger.error(`Failed to revoke invite code: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const groupController = new GroupController();
