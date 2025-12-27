import { BaileysClass } from '../../lib/baileys.js';
import { ConnectionState } from '../types/index.js';
import { logger } from '../config/logger.js';
import { webhookService } from './webhookService.js';

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
        console.log('NEW QR CODE:', qr);

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
        logger.info('BOT IS READY');
        this.connectionState.isConnected = true;
        this.connectionState.qrCode = null;
        this.connectionState.pairingCode = null;

        // Send webhook
        await webhookService.send('connection.ready', {
            status: 'connected',
            timestamp: new Date().toISOString()
        });
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
