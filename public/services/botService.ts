import { BaileysClass } from '../../src/baileys';
import { ConnectionState } from '../types/index';
import { logger } from '../config/logger';
import { webhookService } from './webhookService';

class BotService {
    public bot: BaileysClass;
    public connectionState: ConnectionState;

    constructor() {
        this.bot = new BaileysClass({});
        this.connectionState = {
            isConnected: false,
            qrCode: null,
            pairingCode: null,
            phoneNumber: null,
            lastQRUpdate: null,
            lastPairingUpdate: null
        };

        this.setupEventHandlers();
    }

    async reinitializeWithMode(mode: 'qr' | 'pairing', phoneNumber?: string) {
        logger.info(`Reinitializing bot with mode: ${mode}`);

        // Clear current state
        this.connectionState.qrCode = null;
        this.connectionState.pairingCode = null;

        if (mode === 'pairing') {
            if (!phoneNumber) {
                throw new Error('Phone number is required for pairing mode');
            }
            this.connectionState.phoneNumber = phoneNumber;
            // Create new bot instance with pairing mode
            this.bot = new BaileysClass({ usePairingCode: true, phoneNumber });
        } else {
            // Create new bot instance with QR mode
            this.bot = new BaileysClass({ usePairingCode: false });
        }

        this.setupEventHandlers();
        logger.info(`Bot reinitialized successfully in ${mode} mode`);
    }

    async logout() {
        logger.info('Logging out bot...');
        try {
            await this.bot.logout();
        } catch (error: any) {
            logger.warn(`Error during socket logout (ignoring to ensure cleanup): ${error.message}`);
        } finally {
            // Force state cleanup
            this.connectionState.isConnected = false;
            this.connectionState.user = undefined;
            this.connectionState.qrCode = null;
            this.connectionState.pairingCode = null;

            // Send webhook
            await webhookService.send('connection.update', {
                status: 'disconnected',
                reason: 'manual_logout',
                timestamp: new Date().toISOString()
            });

            logger.info('Bot state reset to disconnected');
        }
    }

    private setupEventHandlers() {
        this.bot.on('auth_failure', this.handleAuthFailure.bind(this));
        this.bot.on('qr', this.handleQR.bind(this));
        this.bot.on('pairing_code', this.handlePairingCode.bind(this));
        this.bot.on('ready', this.handleReady.bind(this));
        this.bot.on('message', this.handleMessage.bind(this));
    }

    private async handleAuthFailure(error: any) {
        logger.error(`AUTH FAILURE: ${error.message}`, { stack: error.stack });
        this.connectionState.isConnected = false;

        // Send webhook
        await webhookService.send('auth.failure', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }

    private handleQR(qr: string) {
        logger.info('NEW QR CODE RECEIVED');
        this.connectionState.qrCode = qr;
        this.connectionState.lastQRUpdate = new Date().toISOString();
        // QR code available via API - no need to print in terminal

        // Send webhook
        webhookService.send('qr.update', {
            qrCode: qr,
            timestamp: this.connectionState.lastQRUpdate
        });
    }

    private handlePairingCode(code: string) {
        logger.info(`PAIRING CODE RECEIVED: ${code}`);
        this.connectionState.pairingCode = code;
        this.connectionState.lastPairingUpdate = new Date().toISOString();

        // Send webhook
        webhookService.send('pairing.code', {
            pairingCode: code,
            timestamp: this.connectionState.lastPairingUpdate
        });
    }

    private async handleReady() {
        if (this.connectionState.isConnected) {
            return;
        }
        logger.info('BOT IS READY');
        this.connectionState.isConnected = true;
        this.connectionState.qrCode = null;
        this.connectionState.pairingCode = null;

        await this.refreshUserProfile();

        // Send webhook
        await webhookService.send('connection.ready', {
            status: 'connected',
            user: this.connectionState.user,
            timestamp: new Date().toISOString()
        });
    }

    public async refreshUserProfile() {
        // Get user information from socket
        try {
            const sock = this.bot.getInstance();
            const userInfo = sock?.user;

            if (userInfo) {
                this.connectionState.user = {
                    id: userInfo.id || '',
                    name: userInfo.name || userInfo.verifiedName || 'Unknown',
                    phone: userInfo.id?.split(':')[0] || userInfo.id?.split('@')[0] || null
                };

                // Try to get profile picture
                try {
                    const profilePic = await this.bot.getProfilePicture(userInfo.id);
                    if (profilePic) {
                        this.connectionState.user.profilePicture = profilePic;
                    }
                } catch (picError) {
                    logger.warn('Could not fetch profile picture');
                }

                logger.info(`Connected as: ${this.connectionState.user.name} (${this.connectionState.user.phone})`);
            }
        } catch (error: any) {
            logger.error(`Failed to get user info: ${error.message}`);
        }
    }

    private async handleMessage(msg: any) {
        logger.info(`Message received from: ${msg.from}`);

        // Send webhook
        await webhookService.send('message.received', {
            from: msg.from,
            message: msg.body,
            messageId: msg.key?.id,
            timestamp: new Date().toISOString(),
            isGroup: msg.from?.includes('@g.us')
        });
    }
}

export const botService = new BotService();
