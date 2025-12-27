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

const botBaileys = new BaileysClass({});

// Event handler untuk auth_failure
botBaileys.on('auth_failure', async (error) => {
    logger.error(`AUTH FAILURE: ${error.message}`, { stack: error.stack });
});

// Event handler untuk QR Code
botBaileys.on('qr', (qr) => {
    logger.info('NEW QR CODE RECEIVED');
    console.log('NEW QR CODE:', qr); // Tetap tampilkan QR di konsol untuk scan
});

// Event handler untuk bot siap
botBaileys.on('ready', async () => {
    logger.info('BOT IS READY');
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

// Menjalankan server
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
