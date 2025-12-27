import { BaileysClass } from '../lib/baileys.js';
import express from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';
import moment from 'moment-timezone'; // Tambahkan moment-timezone

// Fungsi untuk mendapatkan timestamp dengan zona waktu Jakarta (GMT+7)
const timezoned = () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

// Konfigurasi logger dengan Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }), // Gunakan timestamp dengan zona waktu Jakarta
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? `\n${stack}` : ''}`;
        })
    ),
    transports: [
        // Logging ke file
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        // Logging ke konsol
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
                })
            )
        })
    ]
});

// ========================================
// WEBHOOK SYSTEM
// ========================================

interface WebhookConfig {
    url: string;
    secret?: string;
    events: string[];
    enabled: boolean;
}

let webhookConfig: WebhookConfig | null = null;

/**
 * Send webhook notification
 */
const sendWebhook = async (event: string, data: any) => {
    if (!webhookConfig || !webhookConfig.enabled) return;
    if (!webhookConfig.events.includes(event) && !webhookConfig.events.includes('*')) return;

    try {
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            data
        };

        const headers: any = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event
        };

        if (webhookConfig.secret) {
            // Simple signature for webhook verification
            const crypto = require('crypto');
            const signature = crypto
                .createHmac('sha256', webhookConfig.secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            headers['X-Webhook-Signature'] = signature;
        }

        const response = await fetch(webhookConfig.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            logger.warn(`Webhook delivery failed: ${response.status} ${response.statusText}`);
        } else {
            logger.info(`Webhook delivered: ${event}`);
        }
    } catch (error) {
        logger.error(`Webhook error: ${error.message}`);
    }
};

const botBaileys = new BaileysClass({});

// Connection state management
let connectionState = {
    isConnected: false,
    qrCode: null,
    pairingCode: null,
    phoneNumber: null,
    lastQRUpdate: null,
    lastPairingUpdate: null
};

// Event handler untuk auth_failure
botBaileys.on('auth_failure', async (error) => {
    logger.error(`AUTH FAILURE: ${error.message}`, { stack: error.stack });
    connectionState.isConnected = false;

    // Send webhook
    await sendWebhook('auth.failure', {
        error: error.message,
        timestamp: new Date().toISOString()
    });
});

// Event handler untuk QR Code
botBaileys.on('qr', (qr) => {
    logger.info('NEW QR CODE RECEIVED');
    connectionState.qrCode = qr;
    connectionState.lastQRUpdate = new Date().toISOString();
    console.log('NEW QR CODE:', qr);

    // Send webhook
    sendWebhook('qr.update', {
        qrCode: qr,
        timestamp: connectionState.lastQRUpdate
    });
});

// Event handler untuk Pairing Code
botBaileys.on('pairing_code', (code) => {
    logger.info(`PAIRING CODE RECEIVED: ${code}`);
    connectionState.pairingCode = code;
    connectionState.lastPairingUpdate = new Date().toISOString();

    // Send webhook
    sendWebhook('pairing.code', {
        pairingCode: code,
        timestamp: connectionState.lastPairingUpdate
    });
});

// Event handler untuk bot siap
botBaileys.on('ready', async () => {
    logger.info('BOT IS READY');
    connectionState.isConnected = true;
    connectionState.qrCode = null;
    connectionState.pairingCode = null;

    // Send webhook
    await sendWebhook('connection.ready', {
        status: 'connected',
        timestamp: new Date().toISOString()
    });
});

// Event handler untuk pesan masuk
botBaileys.on('message', async (msg) => {
    logger.info(`Message received from: ${msg.from}`);

    // Send webhook
    await sendWebhook('message.received', {
        from: msg.from,
        message: msg.body,
        messageId: msg.key?.id,
        timestamp: new Date().toISOString(),
        isGroup: msg.from?.includes('@g.us')
    });
});

let awaitingResponse = false;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const API_KEY = 'daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a';

// Middleware autentikasi
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        logger.warn('Forbidden request: Invalid API key');
        res.status(403).json({ error: 'Forbidden: Invalid API key' });
    }
};

// ========================================
// CONNECTION MANAGEMENT ENDPOINTS
// ========================================

// Get connection status
app.get('/connection/status', authenticate, (req, res) => {
    res.json({
        success: true,
        data: {
            isConnected: connectionState.isConnected,
            hasQRCode: !!connectionState.qrCode,
            hasPairingCode: !!connectionState.pairingCode,
            phoneNumber: connectionState.phoneNumber,
            lastQRUpdate: connectionState.lastQRUpdate,
            lastPairingUpdate: connectionState.lastPairingUpdate
        }
    });
});

// Get QR Code
app.get('/connection/qr', authenticate, (req, res) => {
    if (!connectionState.qrCode) {
        return res.status(404).json({
            success: false,
            error: 'No QR code available. Bot might already be connected or waiting for initialization.'
        });
    }

    res.json({
        success: true,
        data: {
            qrCode: connectionState.qrCode,
            timestamp: connectionState.lastQRUpdate,
            expiresIn: '60 seconds'
        }
    });
});

// Request Pairing Code
app.post('/connection/pairing', authenticate, async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({
            error: 'phoneNumber is required (format: 628XXXXXXXXX)'
        });
    }

    try {
        // Restart bot with pairing code mode
        logger.info(`Requesting pairing code for ${phoneNumber}`);

        // Note: This requires bot restart with pairing mode
        // For now, return instruction
        res.json({
            success: true,
            message: 'To use pairing code, restart server with USE_PAIRING_CODE=true and PHONE_NUMBER=' + phoneNumber,
            instruction: 'Run: USE_PAIRING_CODE=true PHONE_NUMBER=' + phoneNumber + ' npm start'
        });
    } catch (error) {
        logger.error(`Failed to request pairing code: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current pairing code (if available)
app.get('/connection/pairing', authenticate, (req, res) => {
    if (!connectionState.pairingCode) {
        return res.status(404).json({
            success: false,
            error: 'No pairing code available. Start server with pairing mode enabled.'
        });
    }

    res.json({
        success: true,
        data: {
            pairingCode: connectionState.pairingCode,
            phoneNumber: connectionState.phoneNumber,
            timestamp: connectionState.lastPairingUpdate,
            expiresIn: '60 seconds'
        }
    });
});

// Disconnect/Logout
app.post('/connection/disconnect', authenticate, async (req, res) => {
    try {
        // Clear session
        await botBaileys.clearSessionAndRestart();
        connectionState.isConnected = false;
        connectionState.qrCode = null;
        connectionState.pairingCode = null;

        logger.info('Bot disconnected and session cleared');
        res.json({
            success: true,
            message: 'Disconnected successfully. Scan QR or use pairing code to reconnect.'
        });
    } catch (error) {
        logger.error(`Failed to disconnect: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// MESSAGE ENDPOINTS
// ========================================

// Endpoint untuk mengirim pesan
app.post('/send-message', authenticate, async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        logger.warn('Invalid request: Missing number or message');
        return res.status(400).json({ error: 'Number and message are required' });
    }

    try {
        await botBaileys.sendText(number, message);
        logger.info(`Message sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        logger.error(`Failed to send message to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint untuk mengirim pesan ke grup
app.post('/send-to-group', authenticate, async (req, res) => {
    const { groupId, message } = req.body;
    if (!groupId || !message) {
        logger.warn('Invalid request: Missing groupId or message');
        return res.status(400).json({ error: 'Group ID and message are required' });
    }

    try {
        await botBaileys.sendTextToGroup(groupId, message);
        logger.info(`Message sent successfully to group ${groupId}`);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        logger.error(`Failed to send message to group ${groupId}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk mengirim reaksi
app.post('/send-reaction', authenticate, async (req, res) => {
    const { remoteJid, messageKey, emoji } = req.body;
    if (!remoteJid || !messageKey || emoji === undefined) {
        logger.warn('Invalid request: Missing remoteJid, messageKey, or emoji');
        return res.status(400).json({ error: 'remoteJid, messageKey, and emoji are required' });
    }

    try {
        await botBaileys.sendReaction(remoteJid, messageKey, emoji);
        logger.info(`Reaction sent successfully to ${remoteJid}`);
        res.status(200).json({ success: true, message: 'Reaction sent successfully' });
    } catch (error) {
        logger.error(`Failed to send reaction: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk mengirim list menu
app.post('/send-list', authenticate, async (req, res) => {
    const { number, title, description, buttonText, sections } = req.body;
    if (!number || !title || !description || !buttonText || !sections) {
        logger.warn('Invalid request: Missing required fields for list');
        return res.status(400).json({ error: 'number, title, description, buttonText, and sections are required' });
    }

    try {
        await botBaileys.sendList(number, title, description, buttonText, sections);
        logger.info(`List sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'List sent successfully' });
    } catch (error) {
        logger.error(`Failed to send list: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk reply pesan
app.post('/send-reply', authenticate, async (req, res) => {
    const { number, message, quotedMessage } = req.body;
    if (!number || !message || !quotedMessage) {
        logger.warn('Invalid request: Missing number, message, or quotedMessage');
        return res.status(400).json({ error: 'number, message, and quotedMessage are required' });
    }

    try {
        await botBaileys.sendReply(number, message, quotedMessage);
        logger.info(`Reply sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Reply sent successfully' });
    } catch (error) {
        logger.error(`Failed to send reply: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk mention user
app.post('/send-mention', authenticate, async (req, res) => {
    const { remoteJid, message, mentions } = req.body;
    if (!remoteJid || !message || !mentions) {
        logger.warn('Invalid request: Missing remoteJid, message, or mentions');
        return res.status(400).json({ error: 'remoteJid, message, and mentions are required' });
    }

    try {
        await botBaileys.sendMention(remoteJid, message, mentions);
        logger.info(`Mention sent successfully to ${remoteJid}`);
        res.status(200).json({ success: true, message: 'Mention sent successfully' });
    } catch (error) {
        logger.error(`Failed to send mention: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk delete pesan
app.post('/delete-message', authenticate, async (req, res) => {
    const { remoteJid, messageKey } = req.body;
    if (!remoteJid || !messageKey) {
        logger.warn('Invalid request: Missing remoteJid or messageKey');
        return res.status(400).json({ error: 'remoteJid and messageKey are required' });
    }

    try {
        await botBaileys.deleteMessage(remoteJid, messageKey);
        logger.info(`Message deleted successfully from ${remoteJid}`);
        res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        logger.error(`Failed to delete message: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk edit pesan
app.post('/edit-message', authenticate, async (req, res) => {
    const { remoteJid, messageKey, newText } = req.body;
    if (!remoteJid || !messageKey || !newText) {
        logger.warn('Invalid request: Missing remoteJid, messageKey, or newText');
        return res.status(400).json({ error: 'remoteJid, messageKey, and newText are required' });
    }

    try {
        await botBaileys.editMessage(remoteJid, messageKey, newText);
        logger.info(`Message edited successfully in ${remoteJid}`);
        res.status(200).json({ success: true, message: 'Message edited successfully' });
    } catch (error) {
        logger.error(`Failed to edit message: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk template message
app.post('/send-template', authenticate, async (req, res) => {
    const { number, content } = req.body;
    if (!number || !content) {
        logger.warn('Invalid request: Missing number or content');
        return res.status(400).json({ error: 'number and content are required' });
    }

    try {
        await botBaileys.sendTemplate(number, content);
        logger.info(`Template sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Template sent successfully' });
    } catch (error) {
        logger.error(`Failed to send template: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🆕 Endpoint untuk forward message
app.post('/forward-message', authenticate, async (req, res) => {
    const { toJid, message } = req.body;
    if (!toJid || !message) {
        logger.warn('Invalid request: Missing toJid or message');
        return res.status(400).json({ error: 'toJid and message are required' });
    }

    try {
        await botBaileys.forwardMessage(toJid, message);
        logger.info(`Message forwarded successfully to ${toJid}`);
        res.status(200).json({ success: true, message: 'Message forwarded successfully' });
    } catch (error) {
        logger.error(`Failed to forward message: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// MEDIA ENDPOINTS
// ========================================

// Send Image
app.post('/send-image', authenticate, async (req, res) => {
    const { number, imageUrl, caption } = req.body;
    if (!number || !imageUrl) {
        logger.warn('Invalid request: Missing number or imageUrl');
        return res.status(400).json({ error: 'number and imageUrl are required' });
    }

    try {
        await botBaileys.sendImage(number, imageUrl, caption || '');
        logger.info(`Image sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Image sent successfully' });
    } catch (error) {
        logger.error(`Failed to send image to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Video
app.post('/send-video', authenticate, async (req, res) => {
    const { number, videoUrl, caption } = req.body;
    if (!number || !videoUrl) {
        logger.warn('Invalid request: Missing number or videoUrl');
        return res.status(400).json({ error: 'number and videoUrl are required' });
    }

    try {
        await botBaileys.sendVideo(number, videoUrl, caption || '');
        logger.info(`Video sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Video sent successfully' });
    } catch (error) {
        logger.error(`Failed to send video to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Audio
app.post('/send-audio', authenticate, async (req, res) => {
    const { number, audioUrl } = req.body;
    if (!number || !audioUrl) {
        logger.warn('Invalid request: Missing number or audioUrl');
        return res.status(400).json({ error: 'number and audioUrl are required' });
    }

    try {
        await botBaileys.sendAudio(number, audioUrl);
        logger.info(`Audio sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Audio sent successfully' });
    } catch (error) {
        logger.error(`Failed to send audio to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Document/File
app.post('/send-document', authenticate, async (req, res) => {
    const { number, documentUrl, filename, mimetype } = req.body;
    if (!number || !documentUrl) {
        logger.warn('Invalid request: Missing number or documentUrl');
        return res.status(400).json({ error: 'number and documentUrl are required' });
    }

    try {
        await botBaileys.sendFile(number, documentUrl);
        logger.info(`Document sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Document sent successfully' });
    } catch (error) {
        logger.error(`Failed to send document to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Sticker
app.post('/send-sticker', authenticate, async (req, res) => {
    const { number, stickerUrl } = req.body;
    if (!number || !stickerUrl) {
        logger.warn('Invalid request: Missing number or stickerUrl');
        return res.status(400).json({ error: 'number and stickerUrl are required' });
    }

    try {
        await botBaileys.sendSticker(number, stickerUrl);
        logger.info(`Sticker sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Sticker sent successfully' });
    } catch (error) {
        logger.error(`Failed to send sticker to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Location
app.post('/send-location', authenticate, async (req, res) => {
    const { number, latitude, longitude, address } = req.body;
    if (!number || !latitude || !longitude) {
        logger.warn('Invalid request: Missing number, latitude, or longitude');
        return res.status(400).json({ error: 'number, latitude, and longitude are required' });
    }

    try {
        await botBaileys.sendLocation(number, latitude, longitude, address);
        logger.info(`Location sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Location sent successfully' });
    } catch (error) {
        logger.error(`Failed to send location to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Contact
app.post('/send-contact', authenticate, async (req, res) => {
    const { number, contactName, contactNumber } = req.body;
    if (!number || !contactName || !contactNumber) {
        logger.warn('Invalid request: Missing number, contactName, or contactNumber');
        return res.status(400).json({ error: 'number, contactName, and contactNumber are required' });
    }

    try {
        await botBaileys.sendContact(number, contactName, contactNumber);
        logger.info(`Contact sent successfully to ${number}`);
        res.status(200).json({ success: true, message: 'Contact sent successfully' });
    } catch (error) {
        logger.error(`Failed to send contact to ${number}: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// CONTACT MANAGEMENT ENDPOINTS
// ========================================

// Get all contacts
app.get('/contacts', authenticate, async (req, res) => {
    try {
        const contacts = await botBaileys.getContacts();
        logger.info('Contacts retrieved successfully');
        res.status(200).json({
            success: true,
            data: contacts,
            count: contacts.length
        });
    } catch (error) {
        logger.error(`Failed to get contacts: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get contact info by JID
app.get('/contacts/:jid', authenticate, async (req, res) => {
    const { jid } = req.params;

    try {
        const contact = await botBaileys.getContactInfo(jid);
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        logger.info(`Contact info retrieved for ${jid}`);
        res.status(200).json({ success: true, data: contact });
    } catch (error) {
        logger.error(`Failed to get contact info: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Block contact
app.post('/contacts/block', authenticate, async (req, res) => {
    const { jid } = req.body;

    if (!jid) {
        return res.status(400).json({ error: 'jid is required' });
    }

    try {
        await botBaileys.blockContact(jid);
        logger.info(`Contact blocked: ${jid}`);
        res.status(200).json({
            success: true,
            message: 'Contact blocked successfully'
        });
    } catch (error) {
        logger.error(`Failed to block contact: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Unblock contact
app.post('/contacts/unblock', authenticate, async (req, res) => {
    const { jid } = req.body;

    if (!jid) {
        return res.status(400).json({ error: 'jid is required' });
    }

    try {
        await botBaileys.unblockContact(jid);
        logger.info(`Contact unblocked: ${jid}`);
        res.status(200).json({
            success: true,
            message: 'Contact unblocked successfully'
        });
    } catch (error) {
        logger.error(`Failed to unblock contact: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get blocked contacts
app.get('/contacts/blocked', authenticate, async (req, res) => {
    try {
        const blocked = await botBaileys.getBlockedContacts();
        logger.info('Blocked contacts retrieved successfully');
        res.status(200).json({
            success: true,
            data: blocked,
            count: blocked.length
        });
    } catch (error) {
        logger.error(`Failed to get blocked contacts: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get profile picture
app.get('/contacts/:jid/picture', authenticate, async (req, res) => {
    const { jid } = req.params;

    try {
        const pictureUrl = await botBaileys.getProfilePicture(jid);
        logger.info(`Profile picture retrieved for ${jid}`);
        res.status(200).json({
            success: true,
            data: { pictureUrl }
        });
    } catch (error) {
        logger.error(`Failed to get profile picture: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// BOT PROFILE ENDPOINTS
// ========================================

// Update bot profile name
app.post('/bot/profile/name', authenticate, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }

    try {
        await botBaileys.updateProfileName(name);
        logger.info(`Profile name updated to: ${name}`);
        res.status(200).json({
            success: true,
            message: 'Profile name updated successfully'
        });
    } catch (error) {
        logger.error(`Failed to update profile name: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update bot profile status
app.post('/bot/profile/status', authenticate, async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'status is required' });
    }

    try {
        await botBaileys.updateProfileStatus(status);
        logger.info(`Profile status updated to: ${status}`);
        res.status(200).json({
            success: true,
            message: 'Profile status updated successfully'
        });
    } catch (error) {
        logger.error(`Failed to update profile status: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// GROUP MANAGEMENT ENDPOINTS
// ========================================

// Get all groups
app.get('/groups', authenticate, async (req, res) => {
    try {
        const groups = await botBaileys.getGroups();
        logger.info('Groups retrieved successfully');
        res.status(200).json({
            success: true,
            data: groups,
            count: groups.length
        });
    } catch (error) {
        logger.error(`Failed to get groups: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get group info
app.get('/groups/:groupId', authenticate, async (req, res) => {
    const { groupId } = req.params;

    try {
        const groupInfo = await botBaileys.getGroupInfo(groupId);
        logger.info(`Group info retrieved for ${groupId}`);
        res.status(200).json({ success: true, data: groupInfo });
    } catch (error) {
        logger.error(`Failed to get group info: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new group
app.post('/groups/create', authenticate, async (req, res) => {
    const { subject, participants } = req.body;

    if (!subject || !participants || !Array.isArray(participants)) {
        return res.status(400).json({
            error: 'subject and participants (array) are required'
        });
    }

    try {
        const result = await botBaileys.createGroup(subject, participants);
        logger.info(`Group created: ${subject}`);
        res.status(200).json({
            success: true,
            message: 'Group created successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Failed to create group: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add participant to group
app.post('/groups/:groupId/add-participant', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: 'participants (array) is required' });
    }

    try {
        await botBaileys.addParticipant(groupId, participants);
        logger.info(`Participants added to group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Participants added successfully'
        });
    } catch (error) {
        logger.error(`Failed to add participants: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove participant from group
app.post('/groups/:groupId/remove-participant', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: 'participants (array) is required' });
    }

    try {
        await botBaileys.removeParticipant(groupId, participants);
        logger.info(`Participants removed from group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Participants removed successfully'
        });
    } catch (error) {
        logger.error(`Failed to remove participants: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Leave group
app.post('/groups/:groupId/leave', authenticate, async (req, res) => {
    const { groupId } = req.params;

    try {
        await botBaileys.leaveGroup(groupId);
        logger.info(`Left group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Left group successfully'
        });
    } catch (error) {
        logger.error(`Failed to leave group: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update group subject/name
app.post('/groups/:groupId/update-subject', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { subject } = req.body;

    if (!subject) {
        return res.status(400).json({ error: 'subject is required' });
    }

    try {
        await botBaileys.updateGroupSubject(groupId, subject);
        logger.info(`Group subject updated for ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Group subject updated successfully'
        });
    } catch (error) {
        logger.error(`Failed to update group subject: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update group description
app.post('/groups/:groupId/update-description', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { description } = req.body;

    if (!description) {
        return res.status(400).json({ error: 'description is required' });
    }

    try {
        await botBaileys.updateGroupDescription(groupId, description);
        logger.info(`Group description updated for ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Group description updated successfully'
        });
    } catch (error) {
        logger.error(`Failed to update group description: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get group participants
app.get('/groups/:groupId/participants', authenticate, async (req, res) => {
    const { groupId } = req.params;

    try {
        const participants = await botBaileys.getGroupParticipants(groupId);
        logger.info(`Participants retrieved for group ${groupId}`);
        res.status(200).json({
            success: true,
            data: participants,
            count: participants.length
        });
    } catch (error) {
        logger.error(`Failed to get participants: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Promote to admin
app.post('/groups/:groupId/promote-admin', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: 'participants (array) is required' });
    }

    try {
        await botBaileys.promoteToAdmin(groupId, participants);
        logger.info(`Participants promoted to admin in group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Participants promoted to admin successfully'
        });
    } catch (error) {
        logger.error(`Failed to promote to admin: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Demote admin
app.post('/groups/:groupId/demote-admin', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: 'participants (array) is required' });
    }

    try {
        await botBaileys.demoteAdmin(groupId, participants);
        logger.info(`Admins demoted in group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Admins demoted successfully'
        });
    } catch (error) {
        logger.error(`Failed to demote admin: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update group settings
app.post('/groups/:groupId/settings', authenticate, async (req, res) => {
    const { groupId } = req.params;
    const { setting } = req.body;

    if (!setting || !['announcement', 'not_announcement'].includes(setting)) {
        return res.status(400).json({
            error: 'setting must be "announcement" or "not_announcement"'
        });
    }

    try {
        await botBaileys.updateGroupSettings(groupId, setting);
        logger.info(`Group settings updated for ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Group settings updated successfully'
        });
    } catch (error) {
        logger.error(`Failed to update group settings: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get group invite code
app.get('/groups/:groupId/invite-code', authenticate, async (req, res) => {
    const { groupId } = req.params;

    try {
        const inviteCode = await botBaileys.getGroupInviteCode(groupId);
        logger.info(`Invite code retrieved for group ${groupId}`);
        res.status(200).json({
            success: true,
            data: {
                inviteCode,
                inviteLink: `https://chat.whatsapp.com/${inviteCode}`
            }
        });
    } catch (error) {
        logger.error(`Failed to get invite code: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// Revoke group invite code
app.post('/groups/:groupId/revoke-invite', authenticate, async (req, res) => {
    const { groupId } = req.params;

    try {
        const newInviteCode = await botBaileys.revokeGroupInviteCode(groupId);
        logger.info(`Invite code revoked for group ${groupId}`);
        res.status(200).json({
            success: true,
            message: 'Invite code revoked successfully',
            data: {
                inviteCode: newInviteCode,
                inviteLink: `https://chat.whatsapp.com/${newInviteCode}`
            }
        });
    } catch (error) {
        logger.error(`Failed to revoke invite code: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// WEBHOOK ENDPOINTS
// ========================================

// Configure webhook
app.post('/webhooks/configure', authenticate, async (req, res) => {
    const { url, secret, events } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'url is required' });
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    webhookConfig = {
        url,
        secret: secret || undefined,
        events: events || ['*'], // Default to all events
        enabled: true
    };

    logger.info(`Webhook configured: ${url}`);
    res.status(200).json({
        success: true,
        message: 'Webhook configured successfully',
        data: {
            url: webhookConfig.url,
            events: webhookConfig.events,
            hasSecret: !!webhookConfig.secret
        }
    });
});

// Get webhook status
app.get('/webhooks/status', authenticate, (req, res) => {
    if (!webhookConfig) {
        return res.status(200).json({
            success: true,
            data: {
                configured: false,
                enabled: false
            }
        });
    }

    res.status(200).json({
        success: true,
        data: {
            configured: true,
            enabled: webhookConfig.enabled,
            url: webhookConfig.url,
            events: webhookConfig.events,
            hasSecret: !!webhookConfig.secret
        }
    });
});

// Disable webhook
app.post('/webhooks/disable', authenticate, (req, res) => {
    if (webhookConfig) {
        webhookConfig.enabled = false;
        logger.info('Webhook disabled');
    }

    res.status(200).json({
        success: true,
        message: 'Webhook disabled successfully'
    });
});

// Enable webhook
app.post('/webhooks/enable', authenticate, (req, res) => {
    if (!webhookConfig) {
        return res.status(400).json({
            error: 'No webhook configured. Use POST /webhooks/configure first.'
        });
    }

    webhookConfig.enabled = true;
    logger.info('Webhook enabled');

    res.status(200).json({
        success: true,
        message: 'Webhook enabled successfully'
    });
});

// Test webhook
app.post('/webhooks/test', authenticate, async (req, res) => {
    if (!webhookConfig) {
        return res.status(400).json({
            error: 'No webhook configured'
        });
    }

    try {
        await sendWebhook('webhook.test', {
            message: 'This is a test webhook',
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            success: true,
            message: 'Test webhook sent successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// BOT INFO & STATISTICS ENDPOINTS
// ========================================

// Get bot info
app.get('/bot/info', authenticate, async (req, res) => {
    try {
        if (!connectionState.isConnected) {
            return res.status(400).json({
                error: 'Bot is not connected'
            });
        }

        const botInfo = {
            jid: botBaileys.vendor?.user?.id || null,
            name: botBaileys.vendor?.user?.name || 'Unknown',
            phone: botBaileys.vendor?.user?.id?.split('@')[0] || null,
            isConnected: connectionState.isConnected,
            platform: 'WhatsApp Web',
            version: 'Baileys v6.4.0'
        };

        logger.info('Bot info retrieved');
        res.status(200).json({
            success: true,
            data: botInfo
        });
    } catch (error) {
        logger.error(`Failed to get bot info: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get bot status
app.get('/bot/status', authenticate, (req, res) => {
    const status = {
        isConnected: connectionState.isConnected,
        hasQRCode: !!connectionState.qrCode,
        hasPairingCode: !!connectionState.pairingCode,
        lastQRUpdate: connectionState.lastQRUpdate,
        lastPairingUpdate: connectionState.lastPairingUpdate,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
    };

    res.status(200).json({
        success: true,
        data: status
    });
});

// Get bot statistics (placeholder - can be enhanced with database)
app.get('/bot/stats', authenticate, (req, res) => {
    const stats = {
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        memoryUsage: {
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
        },
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
    };

    res.status(200).json({
        success: true,
        data: stats
    });
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

// Menjalankan server
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
