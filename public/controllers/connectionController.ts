import { Request, Response } from 'express';
import { botService } from '../services/botService';
import { logger } from '../config/logger';

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
            return res.status(400).json({
                success: false,
                error: 'phoneNumber is required'
            });
        }

        try {
            // Reinitialize bot with pairing mode
            await botService.reinitializeWithMode('pairing', phoneNumber);

            res.json({
                success: true,
                message: 'Pairing mode activated. Check for pairing code.'
            });
        } catch (error: any) {
            logger.error(`Failed to request pairing: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPairingCode(req: Request, res: Response) {
        if (!botService.connectionState.pairingCode) {
            return res.json({
                success: true,
                data: {
                    pairingCode: null,
                    status: 'waiting_for_code'
                }
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
            await botService.logout();
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

    async reconnect(req: Request, res: Response) {
        try {
            const { mode, phoneNumber } = req.body;

            logger.info('Reconnecting bot...');

            if (mode && (mode === 'qr' || mode === 'pairing')) {
                // Reinitialize with specific mode
                await botService.reinitializeWithMode(mode, phoneNumber);
            } else {
                // Default: restart with QR mode
                await botService.bot.initBailey();
            }

            res.json({
                success: true,
                message: 'Bot reconnection initiated',
                mode: mode || 'qr'
            });
        } catch (error: any) {
            logger.error(`Failed to reconnect: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async refreshProfile(req: Request, res: Response) {
        try {
            if (!botService.connectionState.isConnected) {
                return res.status(400).json({
                    success: false,
                    error: 'Bot is not connected'
                });
            }

            await botService.refreshUserProfile();

            res.json({
                success: true,
                message: 'Profile refreshed successfully',
                data: botService.connectionState.user
            });
        } catch (error: any) {
            logger.error(`Failed to refresh profile: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export const connectionController = new ConnectionController();
