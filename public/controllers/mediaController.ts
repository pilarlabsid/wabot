import { Request, Response } from 'express';
import { botService } from '../services/botService';
import { logger } from '../config/logger';
import fs from 'fs';
import utils from '../../src/utils';

export class MediaController {
    async sendImage(req: Request, res: Response) {
        const { number, imageUrl, caption } = req.body;

        if (!number || !imageUrl) {
            return res.status(400).json({ error: 'number and imageUrl are required' });
        }

        try {
            await botService.bot.sendMedia(number, imageUrl, caption);
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
            await botService.bot.sendMedia(number, videoUrl, caption);
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
            await botService.bot.sendMedia(number, audioUrl, '');
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
            await botService.bot.sendDocument(number, documentUrl, fileName, mimetype);
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
            await botService.bot.sendSticker(number, stickerUrl, {});
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
            // Format number to WhatsApp JID
            const formattedNumber = utils.formatPhone(number);
            await botService.bot.sendLocation(formattedNumber, latitude, longitude, name);
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
            // Format number to WhatsApp JID
            const formattedNumber = utils.formatPhone(number);
            await botService.bot.sendContact(formattedNumber, contactNumber, contactName);
            logger.info(`Contact sent to ${number}`);
            res.status(200).json({ success: true, message: 'Contact sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send contact: ${error.message}`, { stack: error.stack });
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // File upload endpoints
    async uploadAndSendImage(req: Request, res: Response) {
        const { number, caption } = req.body;
        const file = req.file;

        if (!number || !file) {
            return res.status(400).json({ error: 'number and file are required' });
        }

        try {
            await botService.bot.sendImage(number, file.path, caption || '');
            logger.info(`Image uploaded and sent to ${number}`);

            // Clean up uploaded file
            fs.unlinkSync(file.path);

            res.status(200).json({ success: true, message: 'Image sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send uploaded image: ${error.message}`, { stack: error.stack });
            // Clean up file on error
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async uploadAndSendVideo(req: Request, res: Response) {
        const { number, caption } = req.body;
        const file = req.file;

        if (!number || !file) {
            return res.status(400).json({ error: 'number and file are required' });
        }

        try {
            await botService.bot.sendVideo(number, file.path, caption || '');
            logger.info(`Video uploaded and sent to ${number}`);

            fs.unlinkSync(file.path);

            res.status(200).json({ success: true, message: 'Video sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send uploaded video: ${error.message}`, { stack: error.stack });
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async uploadAndSendAudio(req: Request, res: Response) {
        const { number } = req.body;
        const file = req.file;

        if (!number || !file) {
            return res.status(400).json({ error: 'number and file are required' });
        }

        try {
            await botService.bot.sendAudio(number, file.path);
            logger.info(`Audio uploaded and sent to ${number}`);

            fs.unlinkSync(file.path);

            res.status(200).json({ success: true, message: 'Audio sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send uploaded audio: ${error.message}`, { stack: error.stack });
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async uploadAndSendDocument(req: Request, res: Response) {
        const { number } = req.body;
        const file = req.file;

        if (!number || !file) {
            return res.status(400).json({ error: 'number and file are required' });
        }

        try {
            await botService.bot.sendFile(number, file.path);
            logger.info(`Document uploaded and sent to ${number}`);

            fs.unlinkSync(file.path);

            res.status(200).json({ success: true, message: 'Document sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send uploaded document: ${error.message}`, { stack: error.stack });
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async uploadAndSendSticker(req: Request, res: Response) {
        const { number, pack, author } = req.body;
        const file = req.file;

        if (!number || !file) {
            return res.status(400).json({ error: 'number and file are required' });
        }

        try {
            const stickerOptions = {
                pack: pack || 'WA Bot',
                author: author || 'Dashboard'
            };

            await botService.bot.sendSticker(number, file.path, stickerOptions);
            logger.info(`Sticker uploaded and sent to ${number}`);

            fs.unlinkSync(file.path);

            res.status(200).json({ success: true, message: 'Sticker sent successfully' });
        } catch (error: any) {
            logger.error(`Failed to send uploaded sticker: ${error.message}`, { stack: error.stack });
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const mediaController = new MediaController();
