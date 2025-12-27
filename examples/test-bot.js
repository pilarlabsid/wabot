import { BaileysClass } from './lib/baileys.js';

console.log('🤖 Starting WhatsApp Bot Test...\n');

const bot = new BaileysClass({ debug: true });

// Event: QR Code
bot.on('qr', (qr) => {
    console.log('📱 QR CODE RECEIVED!');
    console.log('Scan QR code di file: bot.qr.png');
    console.log('Atau lihat QR code di terminal di atas ☝️\n');
});

// Event: Ready
bot.on('ready', async () => {
    console.log('✅ BOT IS READY!\n');
    console.log('Bot siap menerima pesan.');
    console.log('Kirim pesan "test" ke bot untuk mencoba fitur.\n');
});

// Event: Auth Failure
bot.on('auth_failure', (error) => {
    console.error('❌ AUTH FAILURE:', error);
});

// Event: Message
bot.on('message', async (msg) => {
    console.log(`\n📨 Pesan diterima dari: ${msg.from}`);
    console.log(`📝 Isi pesan: ${msg.body}`);

    const command = msg.body?.toLowerCase().trim();

    try {
        switch (command) {
            case 'test':
                await bot.sendText(msg.from, '✅ Bot berfungsi dengan baik!');
                console.log('✅ Sent: Text message');
                break;

            case 'menu':
                await bot.sendList(
                    msg.from,
                    'Menu Test',
                    'Pilih fitur yang ingin ditest',
                    'Lihat Menu',
                    [
                        {
                            title: 'Basic Features',
                            rows: [
                                { title: 'Test Text', rowId: 'text' },
                                { title: 'Test Poll', rowId: 'poll' },
                                { title: 'Test Reaction', rowId: 'reaction' }
                            ]
                        },
                        {
                            title: 'Advanced Features',
                            rows: [
                                { title: 'Test Reply', rowId: 'reply' },
                                { title: 'Test Edit', rowId: 'edit' }
                            ]
                        }
                    ]
                );
                console.log('✅ Sent: List menu');
                break;

            case 'text':
                await bot.sendText(msg.from, 'Ini adalah test pesan text! 📝');
                console.log('✅ Sent: Text message');
                break;

            case 'poll':
                await bot.sendPoll(msg.from, 'Pilih salah satu:', {
                    options: ['Option 1', 'Option 2', 'Option 3']
                });
                console.log('✅ Sent: Poll');
                break;

            case 'reaction':
                await bot.sendReaction(msg.from, msg.key, '❤️');
                console.log('✅ Sent: Reaction');
                break;

            case 'reply':
                await bot.sendReply(msg.from, 'Ini adalah reply ke pesan Anda!', msg);
                console.log('✅ Sent: Reply');
                break;

            case 'edit':
                const sent = await bot.sendText(msg.from, 'Pesan ini akan diedit...');
                setTimeout(async () => {
                    await bot.editMessage(msg.from, sent.key, 'Pesan sudah diedit! ✏️');
                    console.log('✅ Sent: Edit message');
                }, 2000);
                break;

            case 'help':
                const helpText = `🤖 *Bot Test Commands*

Kirim salah satu command berikut:
• test - Test basic functionality
• menu - Lihat menu lengkap
• text - Test text message
• poll - Test poll/voting
• reaction - Test reaction
• reply - Test reply message
• edit - Test edit message
• help - Lihat help ini`;
                await bot.sendText(msg.from, helpText);
                console.log('✅ Sent: Help message');
                break;

            default:
                if (msg.body) {
                    await bot.sendText(msg.from, 'Kirim "help" untuk melihat daftar command.');
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        await bot.sendText(msg.from, `❌ Error: ${error.message}`);
    }
});

console.log('⏳ Waiting for QR code or connection...\n');
