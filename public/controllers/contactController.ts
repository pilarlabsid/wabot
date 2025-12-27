import { Request, Response } from 'express';
import { botService } from '../services/botService.js';
import { logger } from '../config/logger.js';

export class ContactController {
    async getAll(req: Request, res: Response) {
        try {
            const contacts = await botService.bot.getContacts();
            logger.info('Contacts retrieved successfully');
            res.status(200).json({
                success: true,
                data: contacts,
                count: contacts.length
            });
        } catch (error: any) {
            logger.error(`Failed to get contacts: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        const { jid } = req.params;

        try {
            const contact = await botService.bot.getContactInfo(jid);
            logger.info(`Contact info retrieved for ${jid}`);
            res.status(200).json({ success: true, data: contact });
        } catch (error: any) {
            logger.error(`Failed to get contact info: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async block(req: Request, res: Response) {
        const { jid } = req.body;

        if (!jid) {
            return res.status(400).json({ error: 'jid is required' });
        }

        try {
            await botService.bot.blockContact(jid);
            logger.info(`Contact blocked: ${jid}`);
            res.status(200).json({
                success: true,
                message: 'Contact blocked successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to block contact: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async unblock(req: Request, res: Response) {
        const { jid } = req.body;

        if (!jid) {
            return res.status(400).json({ error: 'jid is required' });
        }

        try {
            await botService.bot.unblockContact(jid);
            logger.info(`Contact unblocked: ${jid}`);
            res.status(200).json({
                success: true,
                message: 'Contact unblocked successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to unblock contact: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getBlocked(req: Request, res: Response) {
        try {
            const blocked = await botService.bot.getBlockedContacts();
            logger.info('Blocked contacts retrieved');
            res.status(200).json({
                success: true,
                data: blocked,
                count: blocked.length
            });
        } catch (error: any) {
            logger.error(`Failed to get blocked contacts: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getPicture(req: Request, res: Response) {
        const { jid } = req.params;

        try {
            const pictureUrl = await botService.bot.getProfilePicture(jid);
            logger.info(`Profile picture retrieved for ${jid}`);
            res.status(200).json({
                success: true,
                data: { pictureUrl }
            });
        } catch (error: any) {
            logger.error(`Failed to get profile picture: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateProfileName(req: Request, res: Response) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }

        try {
            await botService.bot.updateProfileName(name);
            logger.info(`Profile name updated to: ${name}`);
            res.status(200).json({
                success: true,
                message: 'Profile name updated successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to update profile name: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateProfileStatus(req: Request, res: Response) {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        try {
            await botService.bot.updateProfileStatus(status);
            logger.info(`Profile status updated to: ${status}`);
            res.status(200).json({
                success: true,
                message: 'Profile status updated successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to update profile status: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const contactController = new ContactController();
