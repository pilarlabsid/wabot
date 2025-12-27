"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysClass = void 0;
const events_1 = require("events");
const pino_1 = __importDefault(require("pino"));
const node_cache_1 = __importDefault(require("node-cache"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const fs_1 = require("fs");
const wa_sticker_formatter_1 = require("wa-sticker-formatter");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const mime_types_1 = __importDefault(require("mime-types"));
const utils_1 = __importDefault(require("./utils"));
const path_1 = require("path");
const fs_extra_1 = __importDefault(require("fs-extra"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
const msgRetryCounterCache = new node_cache_1.default();
class BaileysClass extends events_1.EventEmitter {
    constructor(args = {}) {
        var _a;
        super();
        this.getMessage = async (key) => {
            // Store functionality removed - return undefined
            return baileys_1.proto.Message.fromObject({});
        };
        this.getInstance = () => this.vendor;
        this.initBailey = async () => {
            const logger = (0, pino_1.default)({ level: this.globalVendorArgs.debug ? 'debug' : 'fatal' });
            const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(this.NAME_DIR_SESSION);
            const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
            if (this.globalVendorArgs.debug)
                console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);
            // Temporarily disabled store to fix makeInMemoryStore issue
            // this.store = makeInMemoryStore({ logger })
            // this.store.readFromFile(`${this.NAME_DIR_SESSION}/baileys_store.json`)
            // setInterval(() => {
            //     this.store.writeToFile(`${this.NAME_DIR_SESSION}/baileys_store.json`)
            // }, 10_000)
            try {
                this.setUpBaileySock({ version, logger, state, saveCreds });
            }
            catch (e) {
                this.emit('auth_failure', e);
            }
        };
        this.setUpBaileySock = async ({ version, logger, state, saveCreds }) => {
            this.sock = (0, baileys_1.default)({
                version,
                logger,
                printQRInTerminal: this.plugin || this.globalVendorArgs.usePairingCode ? false : true,
                auth: {
                    creds: state.creds,
                    keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
                },
                browser: baileys_1.Browsers.macOS('Desktop'),
                msgRetryCounterCache,
                generateHighQualityLinkPreview: true,
                getMessage: this.getMessage,
            });
            if (this.globalVendorArgs.usePairingCode) {
                if (this.globalVendorArgs.phoneNumber) {
                    await this.sock.waitForConnectionUpdate((update) => !!update.qr);
                    const code = await this.sock.requestPairingCode(this.globalVendorArgs.phoneNumber);
                    if (this.plugin) {
                        this.emit('require_action', {
                            instructions: [
                                `Acepta la notificación del WhatsApp ${this.globalVendorArgs.phoneNumber} en tu celular 👌`,
                                `El token para la vinculación es: ${code}`,
                                `Necesitas ayuda: https://link.codigoencasa.com/DISCORD`,
                            ],
                        });
                    }
                    else {
                        this.emit('pairing_code', code);
                    }
                }
                else {
                    this.emit('auth_failure', 'phoneNumber is empty');
                }
            }
            this.sock.ev.on('connection.update', this.handleConnectionUpdate);
            this.sock.ev.on('creds.update', saveCreds);
        };
        this.handleConnectionUpdate = async (update) => {
            var _a, _b;
            const { connection, lastDisconnect, qr } = update;
            const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
            if (connection === 'close') {
                if (statusCode !== baileys_1.DisconnectReason.loggedOut)
                    this.initBailey();
                if (statusCode === baileys_1.DisconnectReason.loggedOut)
                    this.clearSessionAndRestart();
            }
            if (connection === 'open') {
                this.vendor = this.sock;
                this.initBusEvents(this.sock);
                this.emit('ready', true);
            }
            if (qr && !this.globalVendorArgs.usePairingCode) {
                // Display QR code in terminal as ASCII art
                console.log('\n📱 SCAN QR CODE BELOW:\n');
                qrcode_terminal_1.default.generate(qr, { small: true });
                console.log('\n');
                if (this.plugin)
                    this.emit('require_action', {
                        instructions: [
                            `Debes escanear el QR Code 👌 ${this.globalVendorArgs.name}.qr.png`,
                            `Recuerda que el QR se actualiza cada minuto `,
                            `Necesitas ayuda: https://link.codigoencasa.com/DISCORD`,
                        ],
                    });
                this.emit('qr', qr);
                if (this.plugin)
                    await utils_1.default.baileyGenerateImage(qr, `${this.globalVendorArgs.name}.qr.png`);
            }
        };
        this.clearSessionAndRestart = () => {
            const PATH_BASE = (0, path_1.join)(process.cwd(), this.NAME_DIR_SESSION);
            fs_extra_1.default.remove(PATH_BASE)
                .then(() => {
                this.initBailey();
            })
                .catch((err) => {
                console.error('Error to delete directory:', err);
            });
        };
        this.busEvents = () => [
            {
                event: 'messages.upsert',
                func: ({ messages, type }) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
                    // Ignore notify messages
                    if (type !== 'notify')
                        return;
                    const [messageCtx] = messages;
                    let payload = {
                        ...messageCtx,
                        body: (_c = (_b = (_a = messageCtx === null || messageCtx === void 0 ? void 0 : messageCtx.message) === null || _a === void 0 ? void 0 : _a.extendedTextMessage) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : (_d = messageCtx === null || messageCtx === void 0 ? void 0 : messageCtx.message) === null || _d === void 0 ? void 0 : _d.conversation,
                        from: (_e = messageCtx === null || messageCtx === void 0 ? void 0 : messageCtx.key) === null || _e === void 0 ? void 0 : _e.remoteJid,
                        type: 'text'
                    };
                    // Ignore pollUpdateMessage
                    if ((_f = messageCtx.message) === null || _f === void 0 ? void 0 : _f.pollUpdateMessage)
                        return;
                    // Ignore broadcast messages
                    if (payload.from === 'status@broadcast')
                        return;
                    // Ignore messages from self
                    if ((_g = payload === null || payload === void 0 ? void 0 : payload.key) === null || _g === void 0 ? void 0 : _g.fromMe)
                        return;
                    // Detect location
                    if ((_h = messageCtx.message) === null || _h === void 0 ? void 0 : _h.locationMessage) {
                        const { degreesLatitude, degreesLongitude } = messageCtx.message.locationMessage;
                        if (typeof degreesLatitude === 'number' && typeof degreesLongitude === 'number') {
                            payload = { ...payload, body: utils_1.default.generateRefprovider('_event_location_'), type: 'location' };
                        }
                    }
                    // Detect  media
                    if ((_j = messageCtx.message) === null || _j === void 0 ? void 0 : _j.imageMessage) {
                        payload = { ...payload, body: utils_1.default.generateRefprovider('_event_media_'), type: 'image' };
                    }
                    // Detect  ectar file
                    if ((_k = messageCtx.message) === null || _k === void 0 ? void 0 : _k.documentMessage) {
                        payload = { ...payload, body: utils_1.default.generateRefprovider('_event_document_'), type: 'file' };
                    }
                    // Detect voice note
                    if ((_l = messageCtx.message) === null || _l === void 0 ? void 0 : _l.audioMessage) {
                        payload = { ...payload, body: utils_1.default.generateRefprovider('_event_voice_note_'), type: 'voice' };
                    }
                    // Check from user and group is valid 
                    if (!utils_1.default.formatPhone(payload.from)) {
                        return;
                    }
                    const btnCtx = (_o = (_m = payload === null || payload === void 0 ? void 0 : payload.message) === null || _m === void 0 ? void 0 : _m.buttonsResponseMessage) === null || _o === void 0 ? void 0 : _o.selectedDisplayText;
                    if (btnCtx)
                        payload.body = btnCtx;
                    const listRowId = (_q = (_p = payload === null || payload === void 0 ? void 0 : payload.message) === null || _p === void 0 ? void 0 : _p.listResponseMessage) === null || _q === void 0 ? void 0 : _q.title;
                    if (listRowId)
                        payload.body = listRowId;
                    payload.from = utils_1.default.formatPhone(payload.from, this.plugin);
                    this.emit('message', payload);
                },
            },
            {
                event: 'messages.update',
                func: async (message) => {
                    var _a;
                    for (const { key, update } of message) {
                        if (update.pollUpdates) {
                            const pollCreation = await this.getMessage(key);
                            if (pollCreation) {
                                const pollMessage = await (0, baileys_1.getAggregateVotesInPollMessage)({
                                    message: pollCreation,
                                    pollUpdates: update.pollUpdates,
                                });
                                const [messageCtx] = message;
                                let payload = {
                                    ...messageCtx,
                                    body: ((_a = pollMessage.find(poll => poll.voters.length > 0)) === null || _a === void 0 ? void 0 : _a.name) || '',
                                    from: utils_1.default.formatPhone(key.remoteJid, this.plugin),
                                    voters: pollCreation,
                                    type: 'poll'
                                };
                                this.emit('message', payload);
                            }
                        }
                    }
                }
            }
        ];
        this.initBusEvents = (_sock) => {
            this.vendor = _sock;
            const listEvents = this.busEvents();
            for (const { event, func } of listEvents) {
                this.vendor.ev.on(event, func);
            }
        };
        /**
         * Send Media
         * @alpha
         * @param {string} number
         * @param {string} message
         * @example await sendMessage('+XXXXXXXXXXX', 'https://dominio.com/imagen.jpg' | 'img/imagen.jpg')
         */
        this.sendMedia = async (number, mediaUrl, text) => {
            try {
                const fileDownloaded = await utils_1.default.generalDownload(mediaUrl);
                const mimeType = mime_types_1.default.lookup(fileDownloaded);
                if (typeof mimeType === 'string' && mimeType.includes('image'))
                    return this.sendImage(number, fileDownloaded, text);
                if (typeof mimeType === 'string' && mimeType.includes('video'))
                    return this.sendVideo(number, fileDownloaded, text);
                if (typeof mimeType === 'string' && mimeType.includes('audio')) {
                    const fileOpus = await utils_1.default.convertAudio(fileDownloaded);
                    return this.sendAudio(number, fileOpus);
                }
                return this.sendFile(number, fileDownloaded);
            }
            catch (error) {
                console.error(`Error enviando media: ${error}`);
                throw error;
            }
        };
        /**
         * Send image
         * @param {*} number
         * @param {*} filePath
         * @param {*} text
         * @returns
         */
        this.sendImage = async (number, filePath, text) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                image: (0, fs_1.readFileSync)(filePath),
                caption: text !== null && text !== void 0 ? text : '',
            });
        };
        /**
         * Enviar video
         * @param {*} number
         * @param {*} imageUrl
         * @param {*} text
         * @returns
         */
        this.sendVideo = async (number, filePath, text) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                video: (0, fs_1.readFileSync)(filePath),
                caption: text,
                gifPlayback: this.globalVendorArgs.gifPlayback,
            });
        };
        /**
         * Enviar audio
         * @alpha
         * @param {string} number
         * @param {string} message
         * @param {boolean} voiceNote optional
         * @example await sendMessage('+XXXXXXXXXXX', 'audio.mp3')
         */
        this.sendAudio = async (number, audioUrl) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                audio: { url: audioUrl },
                ptt: true,
            });
        };
        /**
         *
         * @param {string} number
         * @param {string} message
         * @returns
         */
        this.sendText = async (number, message) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, { text: message });
        };
        /**
         *
         * @param {string} number
         * @param {string} filePath
         * @example await sendMessage('+XXXXXXXXXXX', './document/file.pdf')
         */
        this.sendFile = async (number, filePath) => {
            const numberClean = utils_1.default.formatPhone(number);
            const mimeType = mime_types_1.default.lookup(filePath);
            const fileName = filePath.split('/').pop();
            return this.vendor.sendMessage(numberClean, {
                document: { url: filePath },
                mimetype: mimeType,
                fileName: fileName,
            });
        };
        /**
         *
         * @param {string} number
         * @param {string} text
         * @param {string} footer
         * @param {Array} buttons
         * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
         */
        this.sendButtons = async (number, text, buttons) => {
            const numberClean = utils_1.default.formatPhone(number);
            const templateButtons = buttons.map((btn, i) => ({
                buttonId: `id-btn-${i}`,
                buttonText: { displayText: btn.body },
                type: 1,
            }));
            const buttonMessage = {
                text,
                footer: '',
                buttons: templateButtons,
                headerType: 1,
            };
            return this.vendor.sendMessage(numberClean, buttonMessage);
        };
        /**
        *
        * @param {string} number
        * @param {string} text
        * @param {string} footer
        * @param {Array} poll
        * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
        */
        this.sendPoll = async (number, text, poll) => {
            const numberClean = utils_1.default.formatPhone(number);
            if (poll.options.length < 2)
                return false;
            const pollMessage = {
                name: text,
                values: poll.options,
                selectableCount: 1
            };
            return this.vendor.sendMessage(numberClean, { poll: pollMessage });
        };
        /**
         * @param {string} number
         * @param {string} message
         * @example await sendMessage('+XXXXXXXXXXX', 'Hello World')
         */
        this.sendMessage = async (numberIn, message, options) => {
            var _a, _b, _c;
            const number = utils_1.default.formatPhone(numberIn);
            if ((_a = options.options.buttons) === null || _a === void 0 ? void 0 : _a.length) {
                return this.sendPoll(number, message, {
                    options: (_b = options.options.buttons.map((btn, i) => (btn.body))) !== null && _b !== void 0 ? _b : [],
                });
            }
            if ((_c = options.options) === null || _c === void 0 ? void 0 : _c.media)
                return this.sendMedia(number, options.options.media, message);
            return this.sendText(number, message);
        };
        /**
         * @param {string} remoteJid
         * @param {string} latitude
         * @param {string} longitude
         * @param {any} messages
         * @example await sendLocation("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "xx.xxxx", "xx.xxxx", messages)
         */
        this.sendLocation = async (remoteJid, latitude, longitude, name = null, messages = null) => {
            await this.vendor.sendMessage(remoteJid, {
                location: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                    name: name
                },
            }, { quoted: messages });
            return { status: 'success' };
        };
        /**
         * @param {string} number
         * @param {string} documentUrl
         * @param {string} fileName
         * @param {string} mimetype
         * @param {any} messages
         */
        this.sendDocument = async (number, documentUrl, fileName, mimetype, messages = null) => {
            try {
                const numberClean = utils_1.default.formatPhone(number);
                const fileDownloaded = await utils_1.default.generalDownload(documentUrl);
                return this.vendor.sendMessage(numberClean, {
                    document: { url: fileDownloaded },
                    mimetype: mimetype,
                    fileName: fileName,
                }, { quoted: messages });
            }
            catch (error) {
                console.error(`Error sending document: ${error}`);
                throw error;
            }
        };
        /**
         * @param {string} remoteJid
         * @param {string} contactNumber
         * @param {string} displayName
         * @param {any} messages - optional
         * @example await sendContact("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "+xxxxxxxxxxx", "Robin Smith", messages)
         */
        this.sendContact = async (remoteJid, contactNumber, displayName, messages = null) => {
            const cleanContactNumber = contactNumber.replace(/ /g, '');
            const waid = cleanContactNumber.replace('+', '');
            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${displayName}\n` +
                'ORG:Ashoka Uni;\n' +
                `TEL;type=CELL;type=VOICE;waid=${waid}:${cleanContactNumber}\n` +
                'END:VCARD';
            await this.vendor.sendMessage(remoteJid, {
                contacts: {
                    displayName: displayName,
                    contacts: [{ vcard }],
                },
            }, { quoted: messages });
            return { status: 'success' };
        };
        /**
         * @param {string} remoteJid
         * @param {string} WAPresence
         * @example await sendPresenceUpdate("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "recording")
         */
        this.sendPresenceUpdate = async (remoteJid, WAPresence) => {
            await this.vendor.sendPresenceUpdate(WAPresence, remoteJid);
        };
        /**
         * @param {string} remoteJid
         * @param {string} url
         * @param {object} stickerOptions
         * @param {any} messages - optional
         * @example await sendSticker("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "https://dn/image.png" || "https://dn/image.gif" || "https://dn/image.mp4", {pack: 'User', author: 'Me'}, messages)
         */
        this.sendSticker = async (remoteJid, url, stickerOptions, messages = null) => {
            const number = utils_1.default.formatPhone(remoteJid);
            const sticker = new wa_sticker_formatter_1.Sticker(url, {
                ...stickerOptions,
                quality: 50,
                type: 'crop',
            });
            const buffer = await sticker.toMessage();
            await this.vendor.sendMessage(number, buffer, { quoted: messages });
        };
        /**
         * Mengirim pesan teks ke grup WhatsApp
         *
         * @param {string} remoteJid - ID grup WhatsApp (contoh: "xxxxxxxxxxxxxxxxxx@g.us")
         * @param {string} message - Pesan teks yang akan dikirim
         * @param {any} messages - Opsi kutipan pesan (optional)
         * @example await sendTextToGroup("xxxxxxxxxxxxxxxxxx@g.us", "Hello, Group!", messages)
         * @returns {Promise<{ status: string, message: string }>} - Status pengiriman pesan
         */
        this.sendTextToGroup = async (remoteJid, message, messages = null) => {
            try {
                // Membersihkan dan memformat ID grup
                const groupId = utils_1.default.formatPhone(remoteJid);
                // Mengirim pesan teks ke grup
                await this.vendor.sendMessage(groupId, {
                    text: message,
                }, { quoted: messages });
                return {
                    status: 'success',
                    message: 'Message sent to group successfully',
                };
            }
            catch (error) {
                console.error(`Error sending text to group: ${error.message}`);
                throw error;
            }
        };
        /**
         * ========================================
         * PHASE 1: HIGH PRIORITY FEATURES
         * ========================================
         */
        /**
         * Mengirim reaksi emoji ke pesan tertentu
         *
         * @param {string} remoteJid - ID chat atau grup
         * @param {WAMessageKey} messageKey - Key dari pesan yang akan direaksi
         * @param {string} emoji - Emoji yang akan dikirim (contoh: '👍', '❤️', '' untuk hapus reaksi)
         * @example await sendReaction("628xxx@s.whatsapp.net", messageKey, "👍")
         * @returns {Promise<void>}
         */
        this.sendReaction = async (remoteJid, messageKey, emoji) => {
            const reactionMessage = {
                react: {
                    text: emoji,
                    key: messageKey
                }
            };
            await this.vendor.sendMessage(remoteJid, reactionMessage);
        };
        /**
         * Mengirim list/menu pilihan yang lebih rapi dari buttons
         *
         * @param {string} number - Nomor tujuan
         * @param {string} title - Judul pesan
         * @param {string} description - Deskripsi pesan
         * @param {string} buttonText - Text tombol untuk membuka list
         * @param {Array} sections - Array section dengan rows
         * @example await sendList("628xxx", "Menu", "Pilih menu", "Lihat Menu", [{title: "Section 1", rows: [{title: "Option 1", rowId: "1"}]}])
         * @returns {Promise<any>}
         */
        this.sendList = async (number, title, description, buttonText, sections) => {
            const numberClean = utils_1.default.formatPhone(number);
            const listMessage = {
                text: description,
                footer: '',
                title: title,
                buttonText: buttonText,
                sections: sections
            };
            return this.vendor.sendMessage(numberClean, listMessage);
        };
        /**
         * Membalas pesan tertentu dengan konteks (quote)
         *
         * @param {string} number - Nomor tujuan
         * @param {string} message - Pesan balasan
         * @param {any} quotedMessage - Pesan yang akan di-quote
         * @example await sendReply("628xxx", "Terima kasih!", messageObject)
         * @returns {Promise<any>}
         */
        this.sendReply = async (number, message, quotedMessage) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                text: message
            }, {
                quoted: quotedMessage
            });
        };
        /**
         * Mengirim pesan dengan mention/tag user
         *
         * @param {string} remoteJid - ID grup
         * @param {string} message - Pesan (harus include @nomor untuk setiap mention)
         * @param {string[]} mentions - Array nomor yang di-mention (format: "628xxx@s.whatsapp.net")
         * @example await sendMention("groupId@g.us", "Hello @628xxx", ["628xxx@s.whatsapp.net"])
         * @returns {Promise<any>}
         */
        this.sendMention = async (remoteJid, message, mentions) => {
            return this.vendor.sendMessage(remoteJid, {
                text: message,
                mentions: mentions
            });
        };
        /**
         * Menghapus pesan yang sudah dikirim
         *
         * @param {string} remoteJid - ID chat
         * @param {WAMessageKey} messageKey - Key pesan yang akan dihapus
         * @example await deleteMessage("628xxx@s.whatsapp.net", messageKey)
         * @returns {Promise<void>}
         */
        this.deleteMessage = async (remoteJid, messageKey) => {
            await this.vendor.sendMessage(remoteJid, {
                delete: messageKey
            });
        };
        /**
         * Mengedit pesan yang sudah dikirim
         *
         * @param {string} remoteJid - ID chat
         * @param {WAMessageKey} messageKey - Key pesan yang akan diedit
         * @param {string} newText - Text baru
         * @example await editMessage("628xxx@s.whatsapp.net", messageKey, "Updated text")
         * @returns {Promise<void>}
         */
        this.editMessage = async (remoteJid, messageKey, newText) => {
            await this.vendor.sendMessage(remoteJid, {
                text: newText,
                edit: messageKey
            });
        };
        /**
         * ========================================
         * PHASE 2: MEDIUM PRIORITY FEATURES
         * ========================================
         */
        /**
         * Mengirim template message dengan berbagai tipe button
         *
         * @param {string} number - Nomor tujuan
         * @param {object} content - Content template
         * @example await sendTemplate("628xxx", {text: "Hello", footer: "Footer", buttons: [{type: 'url', text: 'Visit', url: 'https://example.com'}]})
         * @returns {Promise<any>}
         */
        this.sendTemplate = async (number, content) => {
            const numberClean = utils_1.default.formatPhone(number);
            const templateButtons = content.buttons.map((btn, i) => {
                if (btn.type === 'url') {
                    return { index: i, urlButton: { displayText: btn.text, url: btn.url } };
                }
                else if (btn.type === 'call') {
                    return { index: i, callButton: { displayText: btn.text, phoneNumber: btn.phoneNumber } };
                }
                else {
                    return { index: i, quickReplyButton: { displayText: btn.text, id: `btn-${i}` } };
                }
            });
            const templateMessage = {
                text: content.text,
                footer: content.footer || '',
                templateButtons: templateButtons
            };
            return this.vendor.sendMessage(numberClean, templateMessage);
        };
        /**
         * Mengirim interactive message modern dengan header media
         *
         * @param {string} number - Nomor tujuan
         * @param {object} interactive - Interactive content
         * @example await sendInteractive("628xxx", {header: {type: 'text', content: 'Title'}, body: 'Message', footer: 'Footer'})
         * @returns {Promise<any>}
         */
        this.sendInteractive = async (number, interactive) => {
            const numberClean = utils_1.default.formatPhone(number);
            let headerContent = {};
            if (interactive.header) {
                if (interactive.header.type === 'text') {
                    headerContent = { hasMediaAttachment: false, title: interactive.header.content };
                }
                else if (interactive.header.type === 'image') {
                    headerContent = { hasMediaAttachment: true, imageMessage: { url: interactive.header.content } };
                }
                else if (interactive.header.type === 'video') {
                    headerContent = { hasMediaAttachment: true, videoMessage: { url: interactive.header.content } };
                }
            }
            const interactiveMessage = {
                text: interactive.body,
                footer: interactive.footer || '',
                header: headerContent,
                buttons: interactive.buttons || []
            };
            return this.vendor.sendMessage(numberClean, interactiveMessage);
        };
        /**
         * Mengirim live location yang update otomatis
         *
         * @param {string} remoteJid - ID chat atau grup
         * @param {number} latitude - Latitude
         * @param {number} longitude - Longitude
         * @param {number} durationSeconds - Durasi live location (default: 3600 = 1 jam)
         * @example await sendLiveLocation("628xxx@s.whatsapp.net", -6.200000, 106.816666, 3600)
         * @returns {Promise<any>}
         */
        this.sendLiveLocation = async (remoteJid, latitude, longitude, durationSeconds = 3600) => {
            return this.vendor.sendMessage(remoteJid, {
                liveLocationMessage: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                    accuracyInMeters: 0,
                    speedInMps: 0,
                    degreesClockwiseFromMagneticNorth: 0,
                    caption: '',
                    sequenceNumber: 0,
                    timeOffset: durationSeconds,
                    jpegThumbnail: null
                }
            });
        };
        /**
         * Mengirim banyak kontak sekaligus
         *
         * @param {string} remoteJid - ID chat atau grup
         * @param {Array} contacts - Array kontak
         * @example await sendContactsArray("628xxx@s.whatsapp.net", [{displayName: "John", phoneNumber: "+628111"}])
         * @returns {Promise<any>}
         */
        this.sendContactsArray = async (remoteJid, contacts) => {
            const vCards = contacts.map(contact => {
                const cleanNumber = contact.phoneNumber.replace(/ /g, '');
                const waid = cleanNumber.replace('+', '');
                return ('BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    `FN:${contact.displayName}\n` +
                    'ORG:;\n' +
                    `TEL;type=CELL;type=VOICE;waid=${waid}:${cleanNumber}\n` +
                    'END:VCARD');
            });
            return this.vendor.sendMessage(remoteJid, {
                contacts: {
                    displayName: `${contacts.length} contacts`,
                    contacts: vCards.map(vcard => ({ vcard }))
                }
            });
        };
        /**
         * Mengirim undangan grup WhatsApp
         *
         * @param {string} number - Nomor tujuan
         * @param {string} groupJid - ID grup
         * @param {string} inviteCode - Kode undangan grup
         * @param {string} caption - Caption pesan (optional)
         * @example await sendGroupInvite("628xxx", "groupId@g.us", "inviteCode123", "Join our group!")
         * @returns {Promise<any>}
         */
        this.sendGroupInvite = async (number, groupJid, inviteCode, caption) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                groupInviteMessage: {
                    groupJid: groupJid,
                    inviteCode: inviteCode,
                    inviteExpiration: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 days
                    groupName: '',
                    caption: caption || 'Join our group',
                    jpegThumbnail: null
                }
            });
        };
        /**
         * Forward pesan ke chat lain
         *
         * @param {string} toJid - ID chat tujuan
         * @param {any} message - Pesan yang akan di-forward
         * @example await forwardMessage("628xxx@s.whatsapp.net", messageObject)
         * @returns {Promise<any>}
         */
        this.forwardMessage = async (toJid, message) => {
            return this.vendor.sendMessage(toJid, {
                forward: message
            });
        };
        /**
         * ========================================
         * PHASE 3: ADVANCED FEATURES
         * ========================================
         */
        /**
         * Mengirim media yang hanya bisa dilihat sekali (view once)
         *
         * @param {string} number - Nomor tujuan
         * @param {string} mediaPath - Path atau URL media
         * @param {string} caption - Caption (optional)
         * @example await sendViewOnce("628xxx", "./image.jpg", "Secret photo")
         * @returns {Promise<any>}
         */
        this.sendViewOnce = async (number, mediaPath, caption) => {
            const numberClean = utils_1.default.formatPhone(number);
            const fileDownloaded = await utils_1.default.generalDownload(mediaPath);
            const mimeType = mime_types_1.default.lookup(fileDownloaded);
            let messageContent = {};
            if (typeof mimeType === 'string' && mimeType.includes('image')) {
                messageContent = {
                    image: (0, fs_1.readFileSync)(fileDownloaded),
                    caption: caption || '',
                    viewOnce: true
                };
            }
            else if (typeof mimeType === 'string' && mimeType.includes('video')) {
                messageContent = {
                    video: (0, fs_1.readFileSync)(fileDownloaded),
                    caption: caption || '',
                    viewOnce: true
                };
            }
            else {
                throw new Error('View once only supports image or video');
            }
            return this.vendor.sendMessage(numberClean, messageContent);
        };
        /**
         * Mengirim katalog produk WhatsApp Business
         *
         * @param {string} number - Nomor tujuan
         * @param {object} product - Data produk
         * @example await sendProduct("628xxx", {productId: "123", title: "Product", description: "Desc", price: "100000", imageUrl: "url"})
         * @returns {Promise<any>}
         */
        this.sendProduct = async (number, product) => {
            const numberClean = utils_1.default.formatPhone(number);
            return this.vendor.sendMessage(numberClean, {
                productMessage: {
                    product: {
                        productId: product.productId,
                        title: product.title,
                        description: product.description,
                        currencyCode: 'IDR',
                        priceAmount1000: parseInt(product.price) * 1000,
                        productImageCount: 1
                    },
                    businessOwnerJid: this.vendor.user.id
                }
            });
        };
        /**
         * Mengirim order atau invoice
         *
         * @param {string} number - Nomor tujuan
         * @param {object} order - Data order
         * @example await sendOrder("628xxx", {orderId: "ORD123", items: [{name: "Item", price: 10000, quantity: 2}], total: 20000})
         * @returns {Promise<any>}
         */
        this.sendOrder = async (number, order) => {
            const numberClean = utils_1.default.formatPhone(number);
            const itemsText = order.items.map(item => `${item.name} x${item.quantity} - Rp ${item.price.toLocaleString()}`).join('\n');
            const orderMessage = `*ORDER #${order.orderId}*\n\n${itemsText}\n\n*Total: Rp ${order.total.toLocaleString()}*`;
            return this.vendor.sendMessage(numberClean, {
                text: orderMessage
            });
        };
        /**
         * Pin atau unpin pesan di chat
         *
         * @param {string} remoteJid - ID chat
         * @param {WAMessageKey} messageKey - Key pesan yang akan di-pin
         * @param {boolean} pin - true untuk pin, false untuk unpin
         * @example await pinMessage("628xxx@s.whatsapp.net", messageKey, true)
         * @returns {Promise<void>}
         */
        this.pinMessage = async (remoteJid, messageKey, pin = true) => {
            await this.vendor.sendMessage(remoteJid, {
                pinInChat: {
                    key: messageKey,
                    type: pin ? 1 : 0,
                    senderTimestampMs: Date.now()
                }
            });
        };
        // ========================================
        // CONTACT MANAGEMENT METHODS
        // ========================================
        /**
         * Get all contacts
         * @returns {Promise<any>} List of contacts
         */
        this.getContacts = async () => {
            var _a;
            const contacts = await ((_a = this.vendor.store) === null || _a === void 0 ? void 0 : _a.contacts) || {};
            return Object.values(contacts);
        };
        /**
         * Get contact info by JID
         * @param {string} jid - Contact JID
         * @returns {Promise<any>} Contact info
         */
        this.getContactInfo = async (jid) => {
            var _a, _b;
            return await ((_b = (_a = this.vendor.store) === null || _a === void 0 ? void 0 : _a.contacts) === null || _b === void 0 ? void 0 : _b[jid]) || null;
        };
        /**
         * Block a contact
         * @param {string} jid - Contact JID to block
         * @returns {Promise<any>}
         */
        this.blockContact = async (jid) => {
            return await this.vendor.updateBlockStatus(jid, 'block');
        };
        /**
         * Unblock a contact
         * @param {string} jid - Contact JID to unblock
         * @returns {Promise<any>}
         */
        this.unblockContact = async (jid) => {
            return await this.vendor.updateBlockStatus(jid, 'unblock');
        };
        /**
         * Get blocked contacts list
         * @returns {Promise<any>} List of blocked contacts
         */
        this.getBlockedContacts = async () => {
            const blocklist = await this.vendor.fetchBlocklist();
            return blocklist || [];
        };
        /**
         * Update profile name
         * @param {string} name - New profile name
         * @returns {Promise<any>}
         */
        this.updateProfileName = async (name) => {
            return await this.vendor.updateProfileName(name);
        };
        /**
         * Update profile status
         * @param {string} status - New status
         * @returns {Promise<any>}
         */
        this.updateProfileStatus = async (status) => {
            return await this.vendor.updateProfileStatus(status);
        };
        /**
         * Get profile picture URL
         * @param {string} jid - Contact JID
         * @returns {Promise<string>} Profile picture URL
         */
        this.getProfilePicture = async (jid) => {
            try {
                const url = await this.vendor.profilePictureUrl(jid, 'image');
                return url;
            }
            catch (_a) {
                return '';
            }
        };
        // ========================================
        // GROUP MANAGEMENT METHODS
        // ========================================
        /**
         * Get all groups
         * @returns {Promise<any>} List of groups
         */
        this.getGroups = async () => {
            const groups = await this.vendor.groupFetchAllParticipating();
            return Object.values(groups);
        };
        /**
         * Get group info
         * @param {string} groupId - Group ID
         * @returns {Promise<any>} Group info
         */
        this.getGroupInfo = async (groupId) => {
            return await this.vendor.groupMetadata(groupId);
        };
        /**
         * Create new group
         * @param {string} subject - Group name
         * @param {string[]} participants - Array of participant JIDs
         * @returns {Promise<any>} Created group info
         */
        this.createGroup = async (subject, participants) => {
            return await this.vendor.groupCreate(subject, participants);
        };
        /**
         * Add participant to group
         * @param {string} groupId - Group ID
         * @param {string[]} participants - Array of participant JIDs to add
         * @returns {Promise<any>}
         */
        this.addParticipant = async (groupId, participants) => {
            return await this.vendor.groupParticipantsUpdate(groupId, participants, 'add');
        };
        /**
         * Remove participant from group
         * @param {string} groupId - Group ID
         * @param {string[]} participants - Array of participant JIDs to remove
         * @returns {Promise<any>}
         */
        this.removeParticipant = async (groupId, participants) => {
            return await this.vendor.groupParticipantsUpdate(groupId, participants, 'remove');
        };
        /**
         * Leave group
         * @param {string} groupId - Group ID
         * @returns {Promise<any>}
         */
        this.leaveGroup = async (groupId) => {
            return await this.vendor.groupLeave(groupId);
        };
        /**
         * Update group subject/name
         * @param {string} groupId - Group ID
         * @param {string} subject - New group name
         * @returns {Promise<any>}
         */
        this.updateGroupSubject = async (groupId, subject) => {
            return await this.vendor.groupUpdateSubject(groupId, subject);
        };
        /**
         * Update group description
         * @param {string} groupId - Group ID
         * @param {string} description - New description
         * @returns {Promise<any>}
         */
        this.updateGroupDescription = async (groupId, description) => {
            return await this.vendor.groupUpdateDescription(groupId, description);
        };
        /**
         * Get group participants
         * @param {string} groupId - Group ID
         * @returns {Promise<any>} List of participants
         */
        this.getGroupParticipants = async (groupId) => {
            const metadata = await this.vendor.groupMetadata(groupId);
            return metadata.participants;
        };
        /**
         * Promote participant to admin
         * @param {string} groupId - Group ID
         * @param {string[]} participants - Array of participant JIDs
         * @returns {Promise<any>}
         */
        this.promoteToAdmin = async (groupId, participants) => {
            return await this.vendor.groupParticipantsUpdate(groupId, participants, 'promote');
        };
        /**
         * Demote admin to participant
         * @param {string} groupId - Group ID
         * @param {string[]} participants - Array of participant JIDs
         * @returns {Promise<any>}
         */
        this.demoteAdmin = async (groupId, participants) => {
            return await this.vendor.groupParticipantsUpdate(groupId, participants, 'demote');
        };
        /**
         * Update group settings (who can send messages, edit info, etc)
         * @param {string} groupId - Group ID
         * @param {string} setting - 'announcement' or 'not_announcement'
         * @returns {Promise<any>}
         */
        this.updateGroupSettings = async (groupId, setting) => {
            return await this.vendor.groupSettingUpdate(groupId, setting);
        };
        /**
         * Get group invite code
         * @param {string} groupId - Group ID
         * @returns {Promise<string>} Invite code
         */
        this.getGroupInviteCode = async (groupId) => {
            return await this.vendor.groupInviteCode(groupId);
        };
        /**
         * Revoke group invite code
         * @param {string} groupId - Group ID
         * @returns {Promise<string>} New invite code
         */
        this.revokeGroupInviteCode = async (groupId) => {
            return await this.vendor.groupRevokeInvite(groupId);
        };
        this.vendor = null;
        this.globalVendorArgs = { name: `bot`, usePairingCode: false, phoneNumber: null, gifPlayback: false, dir: './', ...args };
        this.NAME_DIR_SESSION = `${this.globalVendorArgs.dir}${this.globalVendorArgs.name}_sessions`;
        this.initBailey();
        // is plugin?
        const err = new Error();
        const stack = err.stack;
        this.plugin = (_a = stack === null || stack === void 0 ? void 0 : stack.includes('createProvider')) !== null && _a !== void 0 ? _a : false;
    }
}
exports.BaileysClass = BaileysClass;
