import { EventEmitter } from 'events';
import { WAMessageContent, WAMessageKey } from '@whiskeysockets/baileys';
type SendMessageOptions = {
    keyword?: string;
    refresh?: string;
    answer?: string;
    options: {
        capture?: boolean;
        child?: any;
        delay?: number;
        nested?: any[];
        keyword?: any;
        callback?: boolean;
        buttons?: {
            body: string;
        }[];
        media?: string;
    };
    refSerialize?: string;
};
export declare class BaileysClass extends EventEmitter {
    private vendor;
    private globalVendorArgs;
    private sock;
    private NAME_DIR_SESSION;
    private plugin;
    constructor(args?: {});
    getMessage: (key: WAMessageKey) => Promise<WAMessageContent | undefined>;
    getInstance: () => any;
    initBailey: () => Promise<void>;
    setUpBaileySock: ({ version, logger, state, saveCreds }: {
        version: any;
        logger: any;
        state: any;
        saveCreds: any;
    }) => Promise<void>;
    handleConnectionUpdate: (update: any) => Promise<void>;
    clearSessionAndRestart: () => void;
    busEvents: () => any[];
    initBusEvents: (_sock: any) => void;
    /**
     * Send Media
     * @alpha
     * @param {string} number
     * @param {string} message
     * @example await sendMessage('+XXXXXXXXXXX', 'https://dominio.com/imagen.jpg' | 'img/imagen.jpg')
     */
    sendMedia: (number: string, mediaUrl: string, text: string) => Promise<any>;
    /**
     * Send image
     * @param {*} number
     * @param {*} filePath
     * @param {*} text
     * @returns
     */
    sendImage: (number: string, filePath: string, text: string) => Promise<any>;
    /**
     * Enviar video
     * @param {*} number
     * @param {*} imageUrl
     * @param {*} text
     * @returns
     */
    sendVideo: (number: string, filePath: string, text: string) => Promise<any>;
    /**
     * Enviar audio
     * @alpha
     * @param {string} number
     * @param {string} message
     * @param {boolean} voiceNote optional
     * @example await sendMessage('+XXXXXXXXXXX', 'audio.mp3')
     */
    sendAudio: (number: string, audioUrl: string) => Promise<any>;
    /**
     *
     * @param {string} number
     * @param {string} message
     * @returns
     */
    sendText: (number: string, message: string) => Promise<any>;
    /**
     *
     * @param {string} number
     * @param {string} filePath
     * @example await sendMessage('+XXXXXXXXXXX', './document/file.pdf')
     */
    sendFile: (number: string, filePath: string) => Promise<any>;
    /**
     *
     * @param {string} number
     * @param {string} text
     * @param {string} footer
     * @param {Array} buttons
     * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
     */
    sendButtons: (number: string, text: string, buttons: any[]) => Promise<any>;
    /**
    *
    * @param {string} number
    * @param {string} text
    * @param {string} footer
    * @param {Array} poll
    * @example await sendMessage("+XXXXXXXXXXX", "Your Text", "Your Footer", [{"buttonId": "id", "buttonText": {"displayText": "Button"}, "type": 1}])
    */
    sendPoll: (number: string, text: string, poll: any) => Promise<boolean>;
    /**
     * @param {string} number
     * @param {string} message
     * @example await sendMessage('+XXXXXXXXXXX', 'Hello World')
     */
    sendMessage: (numberIn: string, message: string, options: SendMessageOptions) => Promise<any>;
    /**
     * @param {string} remoteJid
     * @param {string} latitude
     * @param {string} longitude
     * @param {any} messages
     * @example await sendLocation("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "xx.xxxx", "xx.xxxx", messages)
     */
    sendLocation: (remoteJid: string, latitude: string, longitude: string, messages?: any) => Promise<{
        status: string;
    }>;
    /**
     * @param {string} remoteJid
     * @param {string} contactNumber
     * @param {string} displayName
     * @param {any} messages - optional
     * @example await sendContact("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "+xxxxxxxxxxx", "Robin Smith", messages)
     */
    sendContact: (remoteJid: string, contactNumber: string, displayName: string, messages?: any) => Promise<{
        status: string;
    }>;
    /**
     * @param {string} remoteJid
     * @param {string} WAPresence
     * @example await sendPresenceUpdate("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "recording")
     */
    sendPresenceUpdate: (remoteJid: string, WAPresence: string) => Promise<void>;
    /**
     * @param {string} remoteJid
     * @param {string} url
     * @param {object} stickerOptions
     * @param {any} messages - optional
     * @example await sendSticker("xxxxxxxxxxx@c.us" || "xxxxxxxxxxxxxxxxxx@g.us", "https://dn/image.png" || "https://dn/image.gif" || "https://dn/image.mp4", {pack: 'User', author: 'Me'}, messages)
     */
    sendSticker: (remoteJid: string, url: string, stickerOptions: any, messages?: any) => Promise<void>;
    /**
     * Mengirim pesan teks ke grup WhatsApp
     *
     * @param {string} remoteJid - ID grup WhatsApp (contoh: "xxxxxxxxxxxxxxxxxx@g.us")
     * @param {string} message - Pesan teks yang akan dikirim
     * @param {any} messages - Opsi kutipan pesan (optional)
     * @example await sendTextToGroup("xxxxxxxxxxxxxxxxxx@g.us", "Hello, Group!", messages)
     * @returns {Promise<{ status: string, message: string }>} - Status pengiriman pesan
     */
    sendTextToGroup: (remoteJid: string, message: string, messages?: any) => Promise<{
        status: string;
        message: string;
    }>;
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
    sendReaction: (remoteJid: string, messageKey: WAMessageKey, emoji: string) => Promise<void>;
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
    sendList: (number: string, title: string, description: string, buttonText: string, sections: Array<{
        title: string;
        rows: Array<{
            title: string;
            description?: string;
            rowId: string;
        }>;
    }>) => Promise<any>;
    /**
     * Membalas pesan tertentu dengan konteks (quote)
     *
     * @param {string} number - Nomor tujuan
     * @param {string} message - Pesan balasan
     * @param {any} quotedMessage - Pesan yang akan di-quote
     * @example await sendReply("628xxx", "Terima kasih!", messageObject)
     * @returns {Promise<any>}
     */
    sendReply: (number: string, message: string, quotedMessage: any) => Promise<any>;
    /**
     * Mengirim pesan dengan mention/tag user
     *
     * @param {string} remoteJid - ID grup
     * @param {string} message - Pesan (harus include @nomor untuk setiap mention)
     * @param {string[]} mentions - Array nomor yang di-mention (format: "628xxx@s.whatsapp.net")
     * @example await sendMention("groupId@g.us", "Hello @628xxx", ["628xxx@s.whatsapp.net"])
     * @returns {Promise<any>}
     */
    sendMention: (remoteJid: string, message: string, mentions: string[]) => Promise<any>;
    /**
     * Menghapus pesan yang sudah dikirim
     *
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan dihapus
     * @example await deleteMessage("628xxx@s.whatsapp.net", messageKey)
     * @returns {Promise<void>}
     */
    deleteMessage: (remoteJid: string, messageKey: WAMessageKey) => Promise<void>;
    /**
     * Mengedit pesan yang sudah dikirim
     *
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan diedit
     * @param {string} newText - Text baru
     * @example await editMessage("628xxx@s.whatsapp.net", messageKey, "Updated text")
     * @returns {Promise<void>}
     */
    editMessage: (remoteJid: string, messageKey: WAMessageKey, newText: string) => Promise<void>;
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
    sendTemplate: (number: string, content: {
        text: string;
        footer?: string;
        buttons: Array<{
            type: "url" | "call" | "quick_reply";
            text: string;
            url?: string;
            phoneNumber?: string;
        }>;
    }) => Promise<any>;
    /**
     * Mengirim interactive message modern dengan header media
     *
     * @param {string} number - Nomor tujuan
     * @param {object} interactive - Interactive content
     * @example await sendInteractive("628xxx", {header: {type: 'text', content: 'Title'}, body: 'Message', footer: 'Footer'})
     * @returns {Promise<any>}
     */
    sendInteractive: (number: string, interactive: {
        header?: {
            type: "text" | "image" | "video" | "document";
            content: string;
        };
        body: string;
        footer?: string;
        buttons?: Array<{
            buttonId: string;
            buttonText: {
                displayText: string;
            };
            type: number;
        }>;
    }) => Promise<any>;
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
    sendLiveLocation: (remoteJid: string, latitude: number, longitude: number, durationSeconds?: number) => Promise<any>;
    /**
     * Mengirim banyak kontak sekaligus
     *
     * @param {string} remoteJid - ID chat atau grup
     * @param {Array} contacts - Array kontak
     * @example await sendContactsArray("628xxx@s.whatsapp.net", [{displayName: "John", phoneNumber: "+628111"}])
     * @returns {Promise<any>}
     */
    sendContactsArray: (remoteJid: string, contacts: Array<{
        displayName: string;
        phoneNumber: string;
    }>) => Promise<any>;
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
    sendGroupInvite: (number: string, groupJid: string, inviteCode: string, caption?: string) => Promise<any>;
    /**
     * Forward pesan ke chat lain
     *
     * @param {string} toJid - ID chat tujuan
     * @param {any} message - Pesan yang akan di-forward
     * @example await forwardMessage("628xxx@s.whatsapp.net", messageObject)
     * @returns {Promise<any>}
     */
    forwardMessage: (toJid: string, message: any) => Promise<any>;
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
    sendViewOnce: (number: string, mediaPath: string, caption?: string) => Promise<any>;
    /**
     * Mengirim katalog produk WhatsApp Business
     *
     * @param {string} number - Nomor tujuan
     * @param {object} product - Data produk
     * @example await sendProduct("628xxx", {productId: "123", title: "Product", description: "Desc", price: "100000", imageUrl: "url"})
     * @returns {Promise<any>}
     */
    sendProduct: (number: string, product: {
        productId: string;
        title: string;
        description: string;
        price: string;
        imageUrl: string;
    }) => Promise<any>;
    /**
     * Mengirim order atau invoice
     *
     * @param {string} number - Nomor tujuan
     * @param {object} order - Data order
     * @example await sendOrder("628xxx", {orderId: "ORD123", items: [{name: "Item", price: 10000, quantity: 2}], total: 20000})
     * @returns {Promise<any>}
     */
    sendOrder: (number: string, order: {
        orderId: string;
        items: Array<{
            name: string;
            price: number;
            quantity: number;
        }>;
        total: number;
    }) => Promise<any>;
    /**
     * Pin atau unpin pesan di chat
     *
     * @param {string} remoteJid - ID chat
     * @param {WAMessageKey} messageKey - Key pesan yang akan di-pin
     * @param {boolean} pin - true untuk pin, false untuk unpin
     * @example await pinMessage("628xxx@s.whatsapp.net", messageKey, true)
     * @returns {Promise<void>}
     */
    pinMessage: (remoteJid: string, messageKey: WAMessageKey, pin?: boolean) => Promise<void>;
    /**
     * Get all contacts
     * @returns {Promise<any>} List of contacts
     */
    getContacts: () => Promise<any>;
    /**
     * Get contact info by JID
     * @param {string} jid - Contact JID
     * @returns {Promise<any>} Contact info
     */
    getContactInfo: (jid: string) => Promise<any>;
    /**
     * Block a contact
     * @param {string} jid - Contact JID to block
     * @returns {Promise<any>}
     */
    blockContact: (jid: string) => Promise<any>;
    /**
     * Unblock a contact
     * @param {string} jid - Contact JID to unblock
     * @returns {Promise<any>}
     */
    unblockContact: (jid: string) => Promise<any>;
    /**
     * Get blocked contacts list
     * @returns {Promise<any>} List of blocked contacts
     */
    getBlockedContacts: () => Promise<any>;
    /**
     * Update profile name
     * @param {string} name - New profile name
     * @returns {Promise<any>}
     */
    updateProfileName: (name: string) => Promise<any>;
    /**
     * Update profile status
     * @param {string} status - New status
     * @returns {Promise<any>}
     */
    updateProfileStatus: (status: string) => Promise<any>;
    /**
     * Get profile picture URL
     * @param {string} jid - Contact JID
     * @returns {Promise<string>} Profile picture URL
     */
    getProfilePicture: (jid: string) => Promise<string>;
    /**
     * Get all groups
     * @returns {Promise<any>} List of groups
     */
    getGroups: () => Promise<any>;
    /**
     * Get group info
     * @param {string} groupId - Group ID
     * @returns {Promise<any>} Group info
     */
    getGroupInfo: (groupId: string) => Promise<any>;
    /**
     * Create new group
     * @param {string} subject - Group name
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>} Created group info
     */
    createGroup: (subject: string, participants: string[]) => Promise<any>;
    /**
     * Add participant to group
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs to add
     * @returns {Promise<any>}
     */
    addParticipant: (groupId: string, participants: string[]) => Promise<any>;
    /**
     * Remove participant from group
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs to remove
     * @returns {Promise<any>}
     */
    removeParticipant: (groupId: string, participants: string[]) => Promise<any>;
    /**
     * Leave group
     * @param {string} groupId - Group ID
     * @returns {Promise<any>}
     */
    leaveGroup: (groupId: string) => Promise<any>;
    /**
     * Update group subject/name
     * @param {string} groupId - Group ID
     * @param {string} subject - New group name
     * @returns {Promise<any>}
     */
    updateGroupSubject: (groupId: string, subject: string) => Promise<any>;
    /**
     * Update group description
     * @param {string} groupId - Group ID
     * @param {string} description - New description
     * @returns {Promise<any>}
     */
    updateGroupDescription: (groupId: string, description: string) => Promise<any>;
    /**
     * Get group participants
     * @param {string} groupId - Group ID
     * @returns {Promise<any>} List of participants
     */
    getGroupParticipants: (groupId: string) => Promise<any>;
    /**
     * Promote participant to admin
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>}
     */
    promoteToAdmin: (groupId: string, participants: string[]) => Promise<any>;
    /**
     * Demote admin to participant
     * @param {string} groupId - Group ID
     * @param {string[]} participants - Array of participant JIDs
     * @returns {Promise<any>}
     */
    demoteAdmin: (groupId: string, participants: string[]) => Promise<any>;
    /**
     * Update group settings (who can send messages, edit info, etc)
     * @param {string} groupId - Group ID
     * @param {string} setting - 'announcement' or 'not_announcement'
     * @returns {Promise<any>}
     */
    updateGroupSettings: (groupId: string, setting: "announcement" | "not_announcement") => Promise<any>;
    /**
     * Get group invite code
     * @param {string} groupId - Group ID
     * @returns {Promise<string>} Invite code
     */
    getGroupInviteCode: (groupId: string) => Promise<string>;
    /**
     * Revoke group invite code
     * @param {string} groupId - Group ID
     * @returns {Promise<string>} New invite code
     */
    revokeGroupInviteCode: (groupId: string) => Promise<string>;
}
export {};
