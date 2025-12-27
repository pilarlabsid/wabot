import { EventEmitter } from 'events';
import pino from 'pino'
import NodeCache from 'node-cache'
import qrcode from 'qrcode-terminal'
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    getAggregateVotesInPollMessage,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    Browsers,
    proto,
    WAMessageContent,
    WAMessageKey
} from '@whiskeysockets/baileys'
import { readFileSync } from 'fs';

import { Sticker } from 'wa-sticker-formatter'

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import mime from 'mime-types';

import utils from './utils';
import { join } from 'path';


import fs from 'fs-extra';

interface Args {
    debug?: boolean;
    [key: string]: any;  // Define the shape of this object as needed
}

type SendMessageOptions = {
    keyword?: string,
    refresh?: string,
    answer?: string,
    options: {
        capture?: boolean
        child?: any
        delay?: number
        nested?: any[]
        keyword?: any
        callback?: boolean
        buttons?: { body: string }[]
        media?: string
    },
    refSerialize?: string
}

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const msgRetryCounterCache = new NodeCache()


export class BaileysClass extends EventEmitter {
    private vendor: any;
    private globalVendorArgs: Args;
    private sock: any;
    private NAME_DIR_SESSION: string;
    private plugin: boolean;

    constructor(args = {}) {

        super()
        this.vendor = null;
        this.globalVendorArgs = { name: `bot`, usePairingCode: false, phoneNumber: null, gifPlayback: false, dir: './', ...args };
        this.NAME_DIR_SESSION = `${this.globalVendorArgs.dir}${this.globalVendorArgs.name}_sessions`;
        this.initBailey();

        // is plugin?
        const err = new Error();
        const stack = err.stack;
        this.plugin = stack?.includes('createProvider') ?? false;

    }

    getMessage = async (key: WAMessageKey): Promise<WAMessageContent | undefined> => {
        // Store functionality removed - return undefined
        return proto.Message.fromObject({})
    }

    getInstance = (): any => this.vendor;

    initBailey = async (): Promise<void> => {

        const logger = pino({ level: this.globalVendorArgs.debug ? 'debug' : 'fatal' })
        const { state, saveCreds } = await useMultiFileAuthState(this.NAME_DIR_SESSION);
        const { version, isLatest } = await fetchLatestBaileysVersion()

        if (this.globalVendorArgs.debug) console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

        // Temporarily disabled store to fix makeInMemoryStore issue
        // this.store = makeInMemoryStore({ logger })
        // this.store.readFromFile(`${this.NAME_DIR_SESSION}/baileys_store.json`)
        // setInterval(() => {
        //     this.store.writeToFile(`${this.NAME_DIR_SESSION}/baileys_store.json`)
        // }, 10_000)

        try {
            this.setUpBaileySock({ version, logger, state, saveCreds });
        } catch (e) {
            this.emit('auth_failure', e);
        }
    }

    setUpBaileySock = async ({ version, logger, state, saveCreds }) => {
        this.sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: this.plugin || this.globalVendorArgs.usePairingCode ? false : true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: Browsers.macOS('Desktop'),
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: this.getMessage,
        })

        if (this.globalVendorArgs.usePairingCode) {
            if (this.globalVendorArgs.phoneNumber) {
                await this.sock.waitForConnectionUpdate((update) => !!update.qr)
                const code = await this.sock.requestPairingCode(this.globalVendorArgs.phoneNumber)
                if (this.plugin) {
                    this.emit('require_action', {
                        instructions: [
                            `Acepta la notificación del WhatsApp ${this.globalVendorArgs.phoneNumber} en tu celular 👌`,
                            `El token para la vinculación es: ${code}`,
                            `Necesitas ayuda: https://link.codigoencasa.com/DISCORD`,
                        ],
                    })
                } else {
                    this.emit('pairing_code', code);
                }
            } else {
                this.emit('auth_failure', 'phoneNumber is empty')
            }
        }

        this.sock.ev.on('connection.update', this.handleConnectionUpdate);
        this.sock.ev.on('creds.update', saveCreds)
    }

    handleConnectionUpdate = async (update: any): Promise<void> => {
        const { connection, lastDisconnect, qr } = update;
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (connection === 'close') {
            if (statusCode !== DisconnectReason.loggedOut) this.initBailey();
            if (statusCode === DisconnectReason.loggedOut) this.clearSessionAndRestart();
        }

        if (connection === 'open') {
            this.vendor = this.sock;
            this.initBusEvents(this.sock);
            this.emit('ready', true);
        }

        if (qr && !this.globalVendorArgs.usePairingCode) {
            // Display QR code in terminal as ASCII art
            console.log('\n📱 SCAN QR CODE BELOW:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n');

            if (this.plugin) this.emit('require_action', {
                instructions: [
                    `Debes escanear el QR Code 👌 ${this.globalVendorArgs.name}.qr.png`,
                    `Recuerda que el QR se actualiza cada minuto `,
                    `Necesitas ayuda: https://link.codigoencasa.com/DISCORD`,
                ],
            })
            this.emit('qr', qr);
            if (this.plugin) await utils.baileyGenerateImage(qr, `${this.globalVendorArgs.name}.qr.png`)
        }
    }

    clearSessionAndRestart = (): void => {
        const PATH_BASE = join(process.cwd(), this.NAME_DIR_SESSION);
        fs.remove(PATH_BASE)
            .then(() => {
                this.initBailey();
            })
            .catch((err) => {
                console.error('Error to delete directory:', err);
            });
    }

    busEvents = (): any[] => [
        {
            event: 'messages.upsert',
            func: ({ messages, type }) => {
                // Ignore notify messages
                if (type !== 'notify') return

                const [messageCtx] = messages;
                let payload = {
                    ...messageCtx,
                    body: messageCtx?.message?.extendedTextMessage?.text ?? messageCtx?.message?.conversation,
                    from: messageCtx?.key?.remoteJid,
                    type: 'text'
                };

                // Ignore pollUpdateMessage
                if (messageCtx.message?.pollUpdateMessage) return

                // Ignore broadcast messages
                if (payload.from === 'status@broadcast') return

                // Ignore messages from self
                if (payload?.key?.fromMe) return

                // Detect location
                if (messageCtx.message?.locationMessage) {
                    const { degreesLatitude, degreesLongitude } = messageCtx.message.locationMessage;
                    if (typeof degreesLatitude === 'number' && typeof degreesLongitude === 'number') {
                        payload = { ...payload, body: utils.generateRefprovider('_event_location_'), type: 'location' };
                    }
                }
                // Detect  media
                if (messageCtx.message?.imageMessage) {
                    payload = { ...payload, body: utils.generateRefprovider('_event_media_'), type: 'image' };
                }

                // Detect  ectar file
                if (messageCtx.message?.documentMessage) {
                    payload = { ...payload, body: utils.generateRefprovider('_event_document_'), type: 'file' };
                }

                // Detect voice note
                if (messageCtx.message?.audioMessage) {
                    payload = { ...payload, body: utils.generateRefprovider('_event_voice_note_'), type: 'voice' };
                }

                // Check from user and group is valid 
                if (!utils.formatPhone(payload.from)) {
                    return
                }

                const btnCtx = payload?.message?.buttonsResponseMessage?.selectedDisplayText;
                if (btnCtx) payload.body = btnCtx;

                const listRowId = payload?.message?.listResponseMessage?.title;
                if (listRowId) payload.body = listRowId;

                payload.from = utils.formatPhone(payload.from, this.plugin);
                this.emit('message', payload);
            },
        },
        {
            event: 'messages.update',
            func: async (message) => {
                for (const { key, update } of message) {
                    if (update.pollUpdates) {
                        const pollCreation = await this.getMessage(key)
                        if (pollCreation) {
                            const pollMessage = await getAggregateVotesInPollMessage({
                                message: pollCreation,
                                pollUpdates: update.pollUpdates,
                            })
                            const [messageCtx] = message;

                            let payload = {
                                ...messageCtx,
                                body: pollMessage.find(poll => poll.voters.length > 0)?.name || '',
                                from: utils.formatPhone(key.remoteJid, this.plugin),
                                voters: pollCreation,
                                type: 'poll'
                            };

                            this.emit('message', payload);
                        }
                    }
                }
            }
        }
    ]

    initBusEvents = (_sock: any): void => {
        this.vendor = _sock;
        const listEvents = this.busEvents();

        for (const { event, func } of listEvents) {
            this.vendor.ev.on(event, func);
        }
    }

    /**
     * Send Media
     * @alpha
     * @param {string} number
     * @param {string} message
     * @example await sendMessage('+XXXXXXXXXXX', 'https://dominio.com/imagen.jpg' | 'img/imagen.jpg')
     */

    sendMedia = async (number: string, mediaUrl: string, text: string): Promise<any> => {
        try {
            const fileDownloaded = await utils.generalDownload(mediaUrl);
            const mimeType = mime.lookup(fileDownloaded);

            if (typeof mimeType === 'string' && mimeType.includes('image')) return this.sendImage(number, fileDownloaded, text);
            if (typeof mimeType === 'string' && mimeType.includes('video')) return this.sendVideo(number, fileDownloaded, text);
            if (typeof mimeType === 'string' && mimeType.includes('audio')) {
                const fileOpus = await utils.convertAudio(fileDownloaded);
                return this.sendAudio(number, fileOpus);
            }

            return this.sendFile(number, fileDownloaded)
        } catch (error) {
            console.error(`Error enviando media: ${error}`);
            throw error;
        }
    }

    /**
     * Send image
     * @param {*} number
     * @param {*} filePath
     * @param {*} text
     * @returns
     */
    sendImage = async (number: string, filePath: string, text: string): Promise<any> => {
        const numberClean = utils.formatPhone(number)
        return this.vendor.sendMessage(numberClean, {
            image: readFileSync(filePath),
            caption: text ?? '',
        })
    }

    /**
     * Enviar video
     * @param {*} number
     * @param {*} imageUrl
     * @param {*} text
     * @returns
     */
    sendVideo = async (number: string, filePath: string, text: string): Promise<any> => {
        const numberClean = utils.formatPhone(number)
        return this.vendor.sendMessage(numberClean, {
            video: readFileSync(filePath),
            caption: text,
            gifPlayback: this.globalVendorArgs.gifPlayback,
        })
    }

    /**
     * Enviar audio
     * @alpha
     * @param {string} number
     * @param {string} message
     * @param {boolean} voiceNote optional
     * @example await sendMessage('+XXXXXXXXXXX', 'audio.mp3')
     */

    sendAudio = async (number: string, audioUrl: string): Promise<any> => {
        const numberClean = utils.formatPhone(number)
        return this.vendor.sendMessage(numberClean, {
            audio: { url: audioUrl },
            ptt: true,
        })
    }

    /**
     *
     * @param {string} number
     * @param {string} message
     * @returns
     */
    sendText = async (number: string, message: string): Promise<any> => {
        const numberClean = utils.formatPhone(number)
        return this.vendor.sendMessage(numberClean, { text: message })
    }

    /**
     *
     * @param {string} number
     * @param {string} filePath
     * @example await sendMessage('+XXXXXXXXXXX', './document/file.pdf')
     */

    sendFile = async (number: string, filePath: string): Promise<any> => {
        const numberClean = utils.formatPhone(number)
        const mimeType = mime.lookup(filePath);
        const fileName = filePath.split('/').pop();
        return this.vendor.sendMessage(numberClean, {
            document: { url: filePath },
            mimetype: mimeType,
            fileName: fileName,
        })
    }

    /**
     *
     * @param {string} number
     * @param {string} text
     * @param {string} footer
     * @param {Array} buttons
     * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
     */

    sendButtons = async (number: string, text: string, buttons: any[]): Promise<any> => {
        const numberClean = utils.formatPhone(number)

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

        return this.vendor.sendMessage(numberClean, buttonMessage)
    }

    /**
    *
    * @param {string} number
    * @param {string} text
    * @param {string} footer
    * @param {Array} poll
    * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
    */

    sendPoll = async (number: string, text: string, poll: any): Promise<boolean> => {
        const numberClean = utils.formatPhone(number)

        if (poll.options.length < 2) return false

        const pollMessage = {
            name: text,
            values: poll.options,
            selectableCount: 1
        };
        return this.vendor.sendMessage(numberClean, { poll: pollMessage })
    }

    /**
     * @param {string} number
     * @param {string} message
     * @example await sendMessage('+XXXXXXXXXXX', 'Hello World')
     */


    sendMessage = async (numberIn: string, message: string, options: SendMessageOptions): Promise<any> => {
        const number = utils.formatPhone(numberIn);

        if (options.options.buttons?.length) {
            return this.sendPoll(number, message, {
                options: options.options.buttons.map((btn, i) => (btn.body)) ?? [],
            })
        }
        if (options.options?.media) return this.sendMedia(number, options.options.media, message)
        return this.sendText(number, message)
    }

    /**
     * @param {string} remoteJid
     * @param {string} latitude
     * @param {string} longitude
     * @param {any} messages
     * @example await sendLocation("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "xx.xxxx", "xx.xxxx", messages)
     */

    sendLocation = async (remoteJid: string, latitude: string, longitude: string, messages: any = null): Promise<{ status: string }> => {
        await this.vendor.sendMessage(
            remoteJid,
            {
                location: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                },
            },
            { quoted: messages }
        );

        return { status: 'success' }
    }

    /**
     * @param {string} remoteJid
     * @param {string} contactNumber
     * @param {string} displayName
     * @param {any} messages - optional
     * @example await sendContact("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "+xxxxxxxxxxx", "Robin Smith", messages)
     */

    sendContact = async (remoteJid: string, contactNumber: string, displayName: string, messages: any = null): Promise<{ status: string }> => {

        const cleanContactNumber = contactNumber.replace(/ /g, '');
        const waid = cleanContactNumber.replace('+', '');

        const vcard =
            'BEGIN:VCARD\n' +
            'VERSION:3.0\n' +
            `FN:${displayName}\n` +
            'ORG:Ashoka Uni;\n' +
            `TEL;type=CELL;type=VOICE;waid=${waid}:${cleanContactNumber}\n` +
            'END:VCARD';

        await this.vendor.sendMessage(
            remoteJid,
            {
                contacts: {
                    displayName: displayName,
                    contacts: [{ vcard }],
                },
            },
            { quoted: messages }
        );

        return { status: 'success' }
    }

    /**
     * @param {string} remoteJid
     * @param {string} WAPresence
     * @example await sendPresenceUpdate("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "recording")
     */
    sendPresenceUpdate = async (remoteJid: string, WAPresence: string): Promise<void> => {
        await this.vendor.sendPresenceUpdate(WAPresence, remoteJid);
    }

    /**
     * @param {string} remoteJid
     * @param {string} url
     * @param {object} stickerOptions
     * @param {any} messages - optional
     * @example await sendSticker("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "https://dn/image.png" || "https://dn/image.gif" || "https://dn/image.mp4", {pack: 'User', author: 'Me'}, messages)
     */

    sendSticker = async (remoteJid: string, url: string, stickerOptions: any, messages: any = null): Promise<void> => {
        const number = utils.formatPhone(remoteJid);
        const sticker = new Sticker(url, {
            ...stickerOptions,
            quality: 50,
            type: 'crop',
        });

        const buffer = await sticker.toMessage();

        await this.vendor.sendMessage(number, buffer, { quoted: messages });
    }

    /**
     * Mengirim pesan teks ke grup WhatsApp
     * 
     * @param {string} remoteJid - ID grup WhatsApp (contoh: "xxxxxxxxxxxxxxxxxx@g.us")
     * @param {string} message - Pesan teks yang akan dikirim
     * @param {any} messages - Opsi kutipan pesan (optional)
     * @example await sendTextToGroup("xxxxxxxxxxxxxxxxxx@g.us", "Hello, Group!", messages)
     * @returns {Promise<{ status: string, message: string }>} - Status pengiriman pesan
     */
    sendTextToGroup = async (remoteJid: string, message: string, messages: any = null): Promise<{ status: string, message: string }> => {
        try {
            // Membersihkan dan memformat ID grup
            const groupId = utils.formatPhone(remoteJid);

            // Mengirim pesan teks ke grup
            await this.vendor.sendMessage(
                groupId,
                {
                    text: message,
                },
                { quoted: messages }
            );

            return {
                status: 'success',
                message: 'Message sent to group successfully',
            };
        } catch (error) {
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
    sendReaction = async (remoteJid: string, messageKey: WAMessageKey, emoji: string): Promise<void> => {
        const reactionMessage = {
            react: {
                text: emoji,
                key: messageKey
            }
        };
        await this.vendor.sendMessage(remoteJid, reactionMessage);
    }

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
    sendList = async (
        number: string,
        title: string,
        description: string,
        buttonText: string,
        sections: Array<{
            title: string,
            rows: Array<{
                title: string,
                description?: string,
                rowId: string
            }>
        }>
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

        const listMessage = {
            text: description,
            footer: '',
            title: title,
            buttonText: buttonText,
            sections: sections
        };

        return this.vendor.sendMessage(numberClean, listMessage);
    }

    /**
     * Membalas pesan tertentu dengan konteks (quote)
     * 
     * @param {string} number - Nomor tujuan
     * @param {string} message - Pesan balasan
     * @param {any} quotedMessage - Pesan yang akan di-quote
     * @example await sendReply("628xxx", "Terima kasih!", messageObject)
     * @returns {Promise<any>}
     */
    sendReply = async (number: string, message: string, quotedMessage: any): Promise<any> => {
        const numberClean = utils.formatPhone(number);
        return this.vendor.sendMessage(numberClean, {
            text: message
        }, {
            quoted: quotedMessage
        });
    }

    /**
     * Mengirim pesan dengan mention/tag user
     * 
     * @param {string} remoteJid - ID grup
     * @param {string} message - Pesan (harus include @nomor untuk setiap mention)
     * @param {string[]} mentions - Array nomor yang di-mention (format: "628xxx@s.whatsapp.net")
     * @example await sendMention("groupId@g.us", "Hello @628xxx", ["628xxx@s.whatsapp.net"])
     * @returns {Promise<any>}
     */
    sendMention = async (remoteJid: string, message: string, mentions: string[]): Promise<any> => {
        return this.vendor.sendMessage(remoteJid, {
            text: message,
            mentions: mentions
        });
    }

    /**
     * Menghapus pesan yang sudah dikirim
     * 
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan dihapus
     * @example await deleteMessage("628xxx@s.whatsapp.net", messageKey)
     * @returns {Promise<void>}
     */
    deleteMessage = async (remoteJid: string, messageKey: WAMessageKey): Promise<void> => {
        await this.vendor.sendMessage(remoteJid, {
            delete: messageKey
        });
    }

    /**
     * Mengedit pesan yang sudah dikirim
     * 
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan diedit
     * @param {string} newText - Text baru
     * @example await editMessage("628xxx@s.whatsapp.net", messageKey, "Updated text")
     * @returns {Promise<void>}
     */
    editMessage = async (remoteJid: string, messageKey: WAMessageKey, newText: string): Promise<void> => {
        await this.vendor.sendMessage(remoteJid, {
            text: newText,
            edit: messageKey
        });
    }

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
    sendTemplate = async (
        number: string,
        content: {
            text: string,
            footer?: string,
            buttons: Array<{
                type: 'url' | 'call' | 'quick_reply',
                text: string,
                url?: string,
                phoneNumber?: string
            }>
        }
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

        const templateButtons = content.buttons.map((btn, i) => {
            if (btn.type === 'url') {
                return { index: i, urlButton: { displayText: btn.text, url: btn.url } };
            } else if (btn.type === 'call') {
                return { index: i, callButton: { displayText: btn.text, phoneNumber: btn.phoneNumber } };
            } else {
                return { index: i, quickReplyButton: { displayText: btn.text, id: `btn-${i}` } };
            }
        });

        const templateMessage = {
            text: content.text,
            footer: content.footer || '',
            templateButtons: templateButtons
        };

        return this.vendor.sendMessage(numberClean, templateMessage);
    }

    /**
     * Mengirim interactive message modern dengan header media
     * 
     * @param {string} number - Nomor tujuan
     * @param {object} interactive - Interactive content
     * @example await sendInteractive("628xxx", {header: {type: 'text', content: 'Title'}, body: 'Message', footer: 'Footer'})
     * @returns {Promise<any>}
     */
    sendInteractive = async (
        number: string,
        interactive: {
            header?: { type: 'text' | 'image' | 'video' | 'document', content: string },
            body: string,
            footer?: string,
            buttons?: Array<{ buttonId: string, buttonText: { displayText: string }, type: number }>
        }
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

        let headerContent: any = {};
        if (interactive.header) {
            if (interactive.header.type === 'text') {
                headerContent = { hasMediaAttachment: false, title: interactive.header.content };
            } else if (interactive.header.type === 'image') {
                headerContent = { hasMediaAttachment: true, imageMessage: { url: interactive.header.content } };
            } else if (interactive.header.type === 'video') {
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
    }

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
    sendLiveLocation = async (
        remoteJid: string,
        latitude: number,
        longitude: number,
        durationSeconds: number = 3600
    ): Promise<any> => {
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
    }

    /**
     * Mengirim banyak kontak sekaligus
     * 
     * @param {string} remoteJid - ID chat atau grup
     * @param {Array} contacts - Array kontak
     * @example await sendContactsArray("628xxx@s.whatsapp.net", [{displayName: "John", phoneNumber: "+628111"}])
     * @returns {Promise<any>}
     */
    sendContactsArray = async (
        remoteJid: string,
        contacts: Array<{
            displayName: string,
            phoneNumber: string
        }>
    ): Promise<any> => {
        const vCards = contacts.map(contact => {
            const cleanNumber = contact.phoneNumber.replace(/ /g, '');
            const waid = cleanNumber.replace('+', '');
            return (
                'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${contact.displayName}\n` +
                'ORG:;\n' +
                `TEL;type=CELL;type=VOICE;waid=${waid}:${cleanNumber}\n` +
                'END:VCARD'
            );
        });

        return this.vendor.sendMessage(remoteJid, {
            contacts: {
                displayName: `${contacts.length} contacts`,
                contacts: vCards.map(vcard => ({ vcard }))
            }
        });
    }

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
    sendGroupInvite = async (
        number: string,
        groupJid: string,
        inviteCode: string,
        caption?: string
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

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
    }

    /**
     * Forward pesan ke chat lain
     * 
     * @param {string} toJid - ID chat tujuan
     * @param {any} message - Pesan yang akan di-forward
     * @example await forwardMessage("628xxx@s.whatsapp.net", messageObject)
     * @returns {Promise<any>}
     */
    forwardMessage = async (toJid: string, message: any): Promise<any> => {
        return this.vendor.sendMessage(toJid, {
            forward: message
        });
    }

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
    sendViewOnce = async (number: string, mediaPath: string, caption?: string): Promise<any> => {
        const numberClean = utils.formatPhone(number);
        const fileDownloaded = await utils.generalDownload(mediaPath);
        const mimeType = mime.lookup(fileDownloaded);

        let messageContent: any = {};

        if (typeof mimeType === 'string' && mimeType.includes('image')) {
            messageContent = {
                image: readFileSync(fileDownloaded),
                caption: caption || '',
                viewOnce: true
            };
        } else if (typeof mimeType === 'string' && mimeType.includes('video')) {
            messageContent = {
                video: readFileSync(fileDownloaded),
                caption: caption || '',
                viewOnce: true
            };
        } else {
            throw new Error('View once only supports image or video');
        }

        return this.vendor.sendMessage(numberClean, messageContent);
    }

    /**
     * Mengirim katalog produk WhatsApp Business
     * 
     * @param {string} number - Nomor tujuan
     * @param {object} product - Data produk
     * @example await sendProduct("628xxx", {productId: "123", title: "Product", description: "Desc", price: "100000", imageUrl: "url"})
     * @returns {Promise<any>}
     */
    sendProduct = async (
        number: string,
        product: {
            productId: string,
            title: string,
            description: string,
            price: string,
            imageUrl: string
        }
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

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
    }

    /**
     * Mengirim order atau invoice
     * 
     * @param {string} number - Nomor tujuan
     * @param {object} order - Data order
     * @example await sendOrder("628xxx", {orderId: "ORD123", items: [{name: "Item", price: 10000, quantity: 2}], total: 20000})
     * @returns {Promise<any>}
     */
    sendOrder = async (
        number: string,
        order: {
            orderId: string,
            items: Array<{ name: string, price: number, quantity: number }>,
            total: number
        }
    ): Promise<any> => {
        const numberClean = utils.formatPhone(number);

        const itemsText = order.items.map(item =>
            `${item.name} x${item.quantity} - Rp ${item.price.toLocaleString()}`
        ).join('\n');

        const orderMessage = `*ORDER #${order.orderId}*\n\n${itemsText}\n\n*Total: Rp ${order.total.toLocaleString()}*`;

        return this.vendor.sendMessage(numberClean, {
            text: orderMessage
        });
    }

    /**
     * Pin atau unpin pesan di chat
     * 
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan di-pin
     * @param {boolean} pin - true untuk pin, false untuk unpin
     * @example await pinMessage("628xxx@s.whatsapp.net", messageKey, true)
     * @returns {Promise<void>}
     */
    pinMessage = async (remoteJid: string, messageKey: WAMessageKey, pin: boolean = true): Promise<void> => {
        await this.vendor.sendMessage(remoteJid, {
            pinInChat: {
                key: messageKey,
                type: pin ? 1 : 0,
                senderTimestampMs: Date.now()
            }
        });
    }

    // ========================================
    // CONTACT MANAGEMENT METHODS
    // ========================================

    /**
     * Get all contacts
     * @returns {Promise<any>} List of contacts
     */
    getContacts = async (): Promise<any> => {
        const contacts = await this.vendor.store?.contacts || {};
        return Object.values(contacts);
    }

    /**
     * Get contact info by JID
     * @param {string} jid - Contact JID
     * @returns {Promise<any>} Contact info
     */
    getContactInfo = async (jid: string): Promise<any> => {
        return await this.vendor.store?.contacts?.[jid] || null;
    }

    /**
     * Block a contact
     * @param {string} jid - Contact JID to block
     * @returns {Promise<any>}
     */
    blockContact = async (jid: string): Promise<any> => {
        return await this.vendor.updateBlockStatus(jid, 'block');
    }

    /**
     * Unblock a contact
     * @param {string} jid - Contact JID to unblock
     * @returns {Promise<any>}
     */
    unblockContact = async (jid: string): Promise<any> => {
        return await this.vendor.updateBlockStatus(jid, 'unblock');
    }

    /**
     * Get blocked contacts list
     * @returns {Promise<any>} List of blocked contacts
     */
    getBlockedContacts = async (): Promise<any> => {
        const blocklist = await this.vendor.fetchBlocklist();
        return blocklist || [];
    }

    /**
     * Update profile name
     * @param {string} name - New profile name
     * @returns {Promise<any>}
     */
    updateProfileName = async (name: string): Promise<any> => {
        return await this.vendor.updateProfileName(name);
    }

    /**
     * Update profile status
     * @param {string} status - New status
     * @returns {Promise<any>}
     */
    updateProfileStatus = async (status: string): Promise<any> => {
        return await this.vendor.updateProfileStatus(status);
    }

    /**
     * Get profile picture URL
     * @param {string} jid - Contact JID
     * @returns {Promise<string>} Profile picture URL
     */
    getProfilePicture = async (jid: string): Promise<string> => {
        try {
            const url = await this.vendor.profilePictureUrl(jid, 'image');
            return url;
        } catch {
            return '';
        }
    }

    // ========================================
    // GROUP MANAGEMENT METHODS
    // ========================================

    /**
     * Get all groups
     * @returns {Promise<any>} List of groups
     */
    getGroups = async (): Promise<any> => {
        const groups = await this.vendor.groupFetchAllParticipating();
        return Object.values(groups);
    }

    /**
     * Get group info
     * @param {string} groupId - Group ID
     * @returns {Promise<any>} Group info
     */
    getGroupInfo = async (groupId: string): Promise<any> => {
        return await this.vendor.groupMetadata(groupId);
    }

    /**
     * Create new group
     * @param {string} subject - Group name
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>} Created group info
     */
    createGroup = async (subject: string, participants: string[]): Promise<any> => {
        return await this.vendor.groupCreate(subject, participants);
    }

    /**
     * Add participant to group
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs to add
     * @returns {Promise<any>}
     */
    addParticipant = async (groupId: string, participants: string[]): Promise<any> => {
        return await this.vendor.groupParticipantsUpdate(groupId, participants, 'add');
    }

    /**
     * Remove participant from group
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs to remove
     * @returns {Promise<any>}
     */
    removeParticipant = async (groupId: string, participants: string[]): Promise<any> => {
        return await this.vendor.groupParticipantsUpdate(groupId, participants, 'remove');
    }

    /**
     * Leave group
     * @param {string} groupId - Group ID
     * @returns {Promise<any>}
     */
    leaveGroup = async (groupId: string): Promise<any> => {
        return await this.vendor.groupLeave(groupId);
    }

    /**
     * Update group subject/name
     * @param {string} groupId - Group ID
     * @param {string} subject - New group name
     * @returns {Promise<any>}
     */
    updateGroupSubject = async (groupId: string, subject: string): Promise<any> => {
        return await this.vendor.groupUpdateSubject(groupId, subject);
    }

    /**
     * Update group description
     * @param {string} groupId - Group ID
     * @param {string} description - New description
     * @returns {Promise<any>}
     */
    updateGroupDescription = async (groupId: string, description: string): Promise<any> => {
        return await this.vendor.groupUpdateDescription(groupId, description);
    }

    /**
     * Get group participants
     * @param {string} groupId - Group ID
     * @returns {Promise<any>} List of participants
     */
    getGroupParticipants = async (groupId: string): Promise<any> => {
        const metadata = await this.vendor.groupMetadata(groupId);
        return metadata.participants;
    }

    /**
     * Promote participant to admin
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>}
     */
    promoteToAdmin = async (groupId: string, participants: string[]): Promise<any> => {
        return await this.vendor.groupParticipantsUpdate(groupId, participants, 'promote');
    }

    /**
     * Demote admin to participant
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>}
     */
    demoteAdmin = async (groupId: string, participants: string[]): Promise<any> => {
        return await this.vendor.groupParticipantsUpdate(groupId, participants, 'demote');
    }

    /**
     * Update group settings (who can send messages, edit info, etc)
     * @param {string} groupId - Group ID
     * @param {string} setting - 'announcement' or 'not_announcement'
     * @returns {Promise<any>}
     */
    updateGroupSettings = async (groupId: string, setting: 'announcement' | 'not_announcement'): Promise<any> => {
        return await this.vendor.groupSettingUpdate(groupId, setting);
    }

    /**
     * Get group invite code
     * @param {string} groupId - Group ID
     * @returns {Promise<string>} Invite code
     */
    getGroupInviteCode = async (groupId: string): Promise<string> => {
        return await this.vendor.groupInviteCode(groupId);
    }

    /**
     * Revoke group invite code
     * @param {string} groupId - Group ID
     * @returns {Promise<string>} New invite code
     */
    revokeGroupInviteCode = async (groupId: string): Promise<string> => {
        return await this.vendor.groupRevokeInvite(groupId);
    }
}


