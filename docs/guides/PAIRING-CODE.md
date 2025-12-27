# 🔐 Pairing Code Authentication Guide

## Apa itu Pairing Code?

Pairing Code adalah alternatif dari QR Code untuk menghubungkan WhatsApp bot. Dengan pairing code, Anda tidak perlu scan QR code - cukup masukkan kode 8 digit di WhatsApp.

## 🎯 Kapan Menggunakan Pairing Code?

✅ **Gunakan Pairing Code jika:**
- Server tidak punya GUI/display (headless server)
- Sulit akses kamera untuk scan QR
- Ingin setup remote (kirim code via chat)
- Lebih praktis untuk Anda

✅ **Gunakan QR Code jika:**
- Punya akses langsung ke terminal
- Lebih cepat (tinggal scan)
- Sudah terbiasa dengan QR

---

## 🚀 Cara Menggunakan Pairing Code

### Method 1: Script Interaktif (Recommended)

```bash
node examples/pairing-code.js
```

**Langkah-langkah:**
1. Jalankan command di atas
2. Masukkan nomor WhatsApp (format: 628XXXXXXXXX)
3. Tunggu pairing code muncul (8 digit)
4. Buka WhatsApp di HP:
   - Tap menu (3 titik) → **Linked Devices**
   - Tap **"Link a Device"**
   - Tap **"Link with phone number instead"**
   - Masukkan 8 digit code
5. Bot tersambung! ✅

**Contoh Output:**
```
🔐 WhatsApp Bot - Pairing Code Mode

Masukkan nomor WhatsApp Anda (format: 628XXXXXXXXX): 6281234567890

✅ Nomor: 6281234567890
⏳ Memulai bot dengan pairing code...

==================================================
🔑 PAIRING CODE ANDA:

   A B C D - E F G H

==================================================

📱 Cara menggunakan:
1. Buka WhatsApp di HP Anda
2. Tap menu (3 titik) → Linked Devices
3. Tap "Link a Device"
4. Tap "Link with phone number instead"
5. Masukkan kode: ABCD-EFGH

⏰ Kode akan expired dalam 60 detik!
```

---

### Method 2: Programmatic (Untuk Development)

```javascript
import { BaileysClass } from './lib/baileys.js';

const bot = new BaileysClass({ 
    usePairingCode: true, 
    phoneNumber: '6281234567890'  // Nomor WA Anda
});

bot.on('pairing_code', (code) => {
    console.log('Pairing Code:', code);
    // Kirim code ke user via email/SMS/chat
});

bot.on('ready', () => {
    console.log('Bot connected!');
});
```

---

### Method 3: Production Server

Update `public/server.ts` untuk support pairing code:

```typescript
// Tambahkan environment variable
const USE_PAIRING_CODE = process.env.USE_PAIRING_CODE === 'true';
const PHONE_NUMBER = process.env.PHONE_NUMBER;

const botBaileys = new BaileysClass({ 
    usePairingCode: USE_PAIRING_CODE,
    phoneNumber: PHONE_NUMBER
});

botBaileys.on('pairing_code', (code) => {
    logger.info(`PAIRING CODE: ${code}`);
    // Simpan ke database atau kirim notifikasi
});
```

Jalankan dengan:
```bash
USE_PAIRING_CODE=true PHONE_NUMBER=6281234567890 npm start
```

---

## ⚙️ Environment Variables

Buat file `.env`:
```bash
# Pairing Code Config
USE_PAIRING_CODE=true
PHONE_NUMBER=6281234567890

# Server Config
PORT=3000
API_KEY=your_api_key_here
```

---

## 🔄 Perbandingan QR vs Pairing Code

| Aspek | QR Code | Pairing Code |
|-------|---------|--------------|
| **Kecepatan** | ⚡ Cepat (scan langsung) | 🐢 Agak lambat (ketik manual) |
| **Kemudahan** | ✅ Mudah (tinggal scan) | ✅ Mudah (ketik 8 digit) |
| **Remote Setup** | ❌ Sulit | ✅ Mudah |
| **Headless Server** | ❌ Perlu display | ✅ Tidak perlu display |
| **Expiry Time** | 60 detik | 60 detik |
| **Security** | ✅ Aman | ✅ Aman |

---

## 📝 Tips & Best Practices

### ✅ DO:
- Simpan session setelah berhasil connect
- Backup folder `bot_sessions/` secara berkala
- Gunakan nomor WhatsApp yang valid dan aktif
- Pastikan HP online saat pairing

### ❌ DON'T:
- Jangan share pairing code ke orang lain
- Jangan gunakan nomor yang sudah punya 4 linked devices
- Jangan logout dari HP saat bot sedang connect

---

## 🐛 Troubleshooting

### Pairing code tidak muncul
```bash
# Hapus session lama
rm -rf bot_sessions/

# Jalankan ulang
node examples/pairing-code.js
```

### "Phone number already registered"
- Nomor sudah punya 4 linked devices
- Logout salah satu device di WhatsApp
- Coba lagi

### Code expired
- Pairing code hanya valid 60 detik
- Jalankan ulang script untuk dapat code baru

### Connection failed
```bash
# Check nomor format
# Harus: 628XXXXXXXXX (tanpa +, tanpa spasi)
# Bukan: +62 812 3456 7890
```

---

## 🔐 Security Notes

- Pairing code **sama amannya** dengan QR code
- Code hanya valid 60 detik
- Setiap request generate code baru
- Session tersimpan encrypted di `bot_sessions/`
- Jangan commit folder `bot_sessions/` ke git

---

## 📚 Additional Resources

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Multi-Device Guide](https://faq.whatsapp.com/1324084875126592)
- Project README: [README.md](./README.md)
- Testing Guide: [TESTING.md](./TESTING.md)

---

**Happy Coding! 🚀**
