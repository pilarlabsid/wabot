import { Request, Response } from 'express';
import { botService } from '../services/botService.js';
import { logger } from '../config/logger.js';

export class ConnectionController {
    async getStatus(req: Request, res: Response) {
        res.json({
            success: true,
            data: botService.connectionState
        });
    }

    async getQR(req: Request, res: Response) {
        if (!botService.connectionState.qrCode) {
            return res.status(404).json({
                success: false,
                error: 'No QR code available. Please wait or restart the bot.'
            });
        }

        res.json({
            success: true,
            data: {
                qrCode: botService.connectionState.qrCode,
                timestamp: botService.connectionState.lastQRUpdate
            }
        });
    }

    async requestPairing(req: Request, res: Response) {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'phoneNumber is required' });
        }

        botService.connectionState.phoneNumber = phoneNumber;

        res.json({
            success: true,
            message: 'Pairing mode activated. Please restart the server with USE_PAIRING_CODE=true'
        });
    }

    async getPairingCode(req: Request, res: Response) {
        if (!botService.connectionState.pairingCode) {
            return res.status(404).json({
                success: false,
                error: 'No pairing code available'
            });
        }

        res.json({
            success: true,
            data: {
                pairingCode: botService.connectionState.pairingCode,
                timestamp: botService.connectionState.lastPairingUpdate
            }
        });
    }

    async disconnect(req: Request, res: Response) {
        try {
            botService.bot.clearSessionAndRestart();
            logger.info('Bot disconnected successfully');
            res.json({
                success: true,
                message: 'Disconnected successfully'
            });
        } catch (error: any) {
            logger.error(`Failed to disconnect: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export const connectionController = new ConnectionController();
