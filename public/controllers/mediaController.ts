import { Request, Response } from 'express';
import { botService } from '../services/botService.js';
import { logger } from '../config/logger.js';

export class MediaController {
    async sendImage(req: Request, res: Response) {
        const { number, imageUrl, caption } = req.body;

        if (!number || !imageUrl) {
            return res.status(400).json({ error: 'number and imageUrl are required' });
        }

        try {
            await botService.bot.sendImageMessage(number, imageUrl, caption);
            logger.info(`Image sent to ${number}`);
            res.status(200).json({ success: true, message: 'Image sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send image: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendVideo(req: Request, res: Response) {
        const { number, videoUrl, caption } = req.body;

        if (!number || !videoUrl) {
            return res.status(400).json({ error: 'number and videoUrl are required' });
        }

        try {
            await botService.bot.sendVideoMessage(number, videoUrl, caption);
            logger.info(`Video sent to ${number}`);
            res.status(200).json({ success: true, message: 'Video sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send video: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendAudio(req: Request, res: Response) {
        const { number, audioUrl } = req.body;

        if (!number || !audioUrl) {
            return res.status(400).json({ error: 'number and audioUrl are required' });
        }

        try {
            await botService.bot.sendAudioMessage(number, audioUrl);
            logger.info(`Audio sent to ${number}`);
            res.status(200).json({ success: true, message: 'Audio sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send audio: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendDocument(req: Request, res: Response) {
        const { number, documentUrl, fileName, mimetype } = req.body;

        if (!number || !documentUrl) {
            return res.status(400).json({ error: 'number and documentUrl are required' });
        }

        try {
            await botService.bot.sendDocumentMessage(number, documentUrl, fileName, mimetype);
            logger.info(`Document sent to ${number}`);
            res.status(200).json({ success: true, message: 'Document sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send document: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendSticker(req: Request, res: Response) {
        const { number, stickerUrl } = req.body;

        if (!number || !stickerUrl) {
            return res.status(400).json({ error: 'number and stickerUrl are required' });
        }

        try {
            await botService.bot.sendStickerMessage(number, stickerUrl);
            logger.info(`Sticker sent to ${number}`);
            res.status(200).json({ success: true, message: 'Sticker sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send sticker: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendLocation(req: Request, res: Response) {
        const { number, latitude, longitude, name } = req.body;

        if (!number || !latitude || !longitude) {
            return res.status(400).json({
                error: 'number, latitude, and longitude are required'
            });
        }

        try {
            await botService.bot.sendLocationMessage(number, latitude, longitude, name);
            logger.info(`Location sent to ${number}`);
            res.status(200).json({ success: true, message: 'Location sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send location: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async sendContact(req: Request, res: Response) {
        const { number, contactName, contactNumber } = req.body;

        if (!number || !contactName || !contactNumber) {
            return res.status(400).json({
                error: 'number, contactName, and contactNumber are required'
            });
        }

        try {
            await botService.bot.sendContactMessage(number, contactName, contactNumber);
            logger.info(`Contact sent to ${number}`);
            res.status(200).json({ success: true, message: 'Contact sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send contact: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const mediaController = new MediaController();
