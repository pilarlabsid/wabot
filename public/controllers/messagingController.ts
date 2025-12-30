import { Request, Response } from 'express';
import { botService } from '../services/botService';
import { logger } from '../config/logger';

export class MessagingController {
    async sendMessage(req: Request, res: Response) {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ error: 'number and message are required' });
        }

        try {
            await botService.bot.sendText(number, message);
            logger.info(`Message sent to ${number}`);
            res.status(200).json({ success: true, message: 'Message sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send message: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendToGroup(req: Request, res: Response) {
        const { groupId, message } = req.body;

        if (!groupId || !message) {
            return res.status(400).json({ error: 'groupId and message are required' });
        }

        try {
            await botService.bot.sendText(groupId, message);
            logger.info(`Message sent to group ${groupId}`);
            res.status(200).json({ success: true, message: 'Message sent to group successfully' });
        } catch (error: any) {
            logger.error(`Failed to send group message: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendReaction(req: Request, res: Response) {
        const { number, messageId, emoji } = req.body;

        if (!number || !messageId || !emoji) {
            return res.status(400).json({ error: 'number, messageId and emoji are required' });
        }

        try {
            await botService.bot.sendReaction(number, { remoteJid: number, id: messageId, fromMe: false }, emoji);
            logger.info(`Reaction sent: ${emoji}`);
            res.status(200).json({ success: true, message: 'Reaction sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send reaction: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendList(req: Request, res: Response) {
        const { number, title, buttonText, sections } = req.body;

        if (!number || !title || !buttonText || !sections) {
            return res.status(400).json({
                error: 'number, title, buttonText, and sections are required'
            });
        }

        try {
            await botService.bot.sendList(number, title, '', buttonText, sections);
            logger.info(`List message sent to ${number}`);
            res.status(200).json({ success: true, message: 'List message sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send list: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendReply(req: Request, res: Response) {
        const { number, message, quotedMessageId } = req.body;

        if (!number || !message || !quotedMessageId) {
            return res.status(400).json({
                error: 'number, message, and quotedMessageId are required'
            });
        }

        try {
            await botService.bot.sendReply(number, message, quotedMessageId);
            logger.info(`Reply sent to ${number}`);
            res.status(200).json({ success: true, message: 'Reply sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send reply: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendMention(req: Request, res: Response) {
        const { groupId, message, mentions } = req.body;

        if (!groupId || !message || !mentions) {
            return res.status(400).json({
                error: 'groupId, message, and mentions are required'
            });
        }

        try {
            await botService.bot.sendMention(groupId, message, mentions);
            logger.info(`Mention message sent to ${groupId}`);
            res.status(200).json({ success: true, message: 'Mention sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send mention: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteMessage(req: Request, res: Response) {
        const { number, messageId } = req.body;

        if (!number || !messageId) {
            return res.status(400).json({ error: 'number and messageId is required' });
        }

        try {
            await botService.bot.deleteMessage(number, { remoteJid: number, id: messageId, fromMe: true });
            logger.info(`Message deleted: ${messageId}`);
            res.status(200).json({ success: true, message: 'Message deleted successfully' });
        } catch (error: any) {
            logger.error(`Failed to delete message: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async editMessage(req: Request, res: Response) {
        const { number, messageId, newText } = req.body;

        if (!number || !messageId || !newText) {
            return res.status(400).json({ error: 'number, messageId and newText are required' });
        }

        try {
            await botService.bot.editMessage(number, { remoteJid: number, id: messageId, fromMe: true }, newText);
            logger.info(`Message edited: ${messageId}`);
            res.status(200).json({ success: true, message: 'Message edited successfully' });
        } catch (error: any) {
            logger.error(`Failed to edit message: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendTemplate(req: Request, res: Response) {
        const { number, template } = req.body;

        if (!number || !template) {
            return res.status(400).json({ error: 'number and template are required' });
        }

        try {
            await botService.bot.sendTemplate(number, template);
            logger.info(`Template sent to ${number}`);
            res.status(200).json({ success: true, message: 'Template sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send template: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async forwardMessage(req: Request, res: Response) {
        const { messageId, to } = req.body;

        if (!messageId || !to) {
            return res.status(400).json({ error: 'messageId and to are required' });
        }

        try {
            await botService.bot.forwardMessage(messageId, to);
            logger.info(`Message forwarded to ${to}`);
            res.status(200).json({ success: true, message: 'Message forwarded successfully' });
        } catch (error: any) {
            logger.error(`Failed to forward message: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const messagingController = new MessagingController();
