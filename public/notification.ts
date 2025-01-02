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

// Menjalankan server
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
