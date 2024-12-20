import { BaileysClass } from '../lib/baileys.js';
import express from 'express';
import bodyParser from 'body-parser';

const botBaileys = new BaileysClass({});

botBaileys.on('auth_failure', async (error) => console.log("ERROR BOT: ", error));
botBaileys.on('qr', (qr) => console.log("NEW QR CODE: ", qr));
botBaileys.on('ready', async () => console.log('READY BOT'));

let awaitingResponse = false;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const API_KEY = 'daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a';

const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Invalid API key' });
    }
};

app.post('/send-message', authenticate, async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message are required' });
    }

    try {
        await botBaileys.sendText(number, message);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
