import { BaileysClass } from './lib/baileys.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 WhatsApp Bot - Pairing Code Mode\n');

// Prompt untuk nomor WhatsApp
rl.question('Masukkan nomor WhatsApp Anda (format: 628XXXXXXXXX): ', (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.startsWith('62')) {
        console.error('❌ Format nomor salah! Harus dimulai dengan 62');
        process.exit(1);
    }

    console.log(`\n✅ Nomor: ${phoneNumber}`);
    console.log('⏳ Memulai bot dengan pairing code...\n');

    const bot = new BaileysClass({
        usePairingCode: true,
        phoneNumber: phoneNumber,
        debug: true
    });

    bot.on('pairing_code', (code) => {
        console.log('\n' + '='.repeat(50));
        console.log('🔑 PAIRING CODE ANDA:');
        console.log('\n   ' + code.split('').join(' '));
        console.log('\n' + '='.repeat(50));
        console.log('\n📱 Cara menggunakan:');
        console.log('1. Buka WhatsApp di HP Anda');
        console.log('2. Tap menu (3 titik) → Linked Devices');
        console.log('3. Tap "Link a Device"');
        console.log('4. Tap "Link with phone number instead"');
        console.log('5. Masukkan kode: ' + code);
        console.log('\n⏰ Kode akan expired dalam 60 detik!\n');
    });

    bot.on('ready', () => {
        console.log('\n✅ BOT BERHASIL TERSAMBUNG!');
        console.log('📱 WhatsApp bot siap digunakan!\n');
        console.log('Kirim pesan "test" ke bot untuk mencoba.\n');
    });

    bot.on('auth_failure', (error) => {
        console.error('\n❌ AUTENTIKASI GAGAL:', error);
        console.log('\nCoba jalankan ulang script ini.\n');
        process.exit(1);
    });

    bot.on('message', async (msg) => {
        console.log(`\n📨 Pesan dari: ${msg.from}`);
        console.log(`📝 Isi: ${msg.body}`);

        if (msg.body?.toLowerCase() === 'test') {
            await bot.sendText(msg.from, '✅ Bot berfungsi dengan baik!\n\nPairing code berhasil!');
            console.log('✅ Reply sent!');
        }
    });

    rl.close();
});
