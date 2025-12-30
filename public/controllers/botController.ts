import { Request, Response } from 'express';
import { botService } from '../services/botService';
import { statsService } from '../services/statsService';
import { logger } from '../config/logger';

export class BotController {
    async getInfo(req: Request, res: Response) {
        try {
            if (!botService.connectionState.isConnected) {
                return res.status(400).json({
                    error: 'Bot is not connected'
                });
            }

            const botInfo = {
                jid: (botService.bot as any).vendor?.user?.id || null,
                name: (botService.bot as any).vendor?.user?.name || 'Unknown',
                phone: (botService.bot as any).vendor?.user?.id?.split('@')[0] || null,
                isConnected: botService.connectionState.isConnected,
                platform: 'WhatsApp Web',
                version: 'Baileys v6.4.0'
            };

            logger.info('Bot info retrieved');
            res.status(200).json({
                success: true,
                data: botInfo
            });
        } catch (error: any) {
            logger.error(`Failed to get bot info: ${error.message}`);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getStatus(req: Request, res: Response) {
        const status = {
            isConnected: botService.connectionState.isConnected,
            hasQRCode: !!botService.connectionState.qrCode,
            hasPairingCode: !!botService.connectionState.pairingCode,
            lastQRUpdate: botService.connectionState.lastQRUpdate,
            lastPairingUpdate: botService.connectionState.lastPairingUpdate,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
        };

        res.status(200).json({
            success: true,
            data: status
        });
    }

    async getStats(req: Request, res: Response) {
        const stats = statsService.getStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    }
}

export const botController = new BotController();
