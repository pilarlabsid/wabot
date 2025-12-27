# 🧪 Testing Guide - WhatsApp Bot

## 📋 Cara Mengecek Bot Berfungsi atau Tidak

### Method 1: Test Script (Recommended)

#### 1. Jalankan Test Script
```bash
node examples/test-bot.js
```

#### 2. Scan QR Code
- QR code akan muncul di terminal
- Atau buka file `bot.qr.png`
- Scan dengan WhatsApp di HP Anda (seperti WhatsApp Web)

#### 3. Test Commands
Setelah bot ready, kirim pesan ke bot:

| Command | Fungsi | Expected Result |
|---------|--------|-----------------|
| `test` | Test basic | Bot reply "✅ Bot berfungsi dengan baik!" |
| `menu` | Lihat menu | Bot kirim list menu interaktif |
| `text` | Test text | Bot kirim text message |
| `poll` | Test poll | Bot kirim polling dengan 3 opsi |
| `reaction` | Test reaction | Bot kirim reaction ❤️ |
| `reply` | Test reply | Bot reply ke pesan Anda |
| `edit` | Test edit | Bot kirim pesan lalu edit setelah 2 detik |
| `help` | Lihat help | Bot kirim daftar command |

---

### Method 2: REST API Server

#### 1. Start Server
```bash
npm start
```

#### 2. Scan QR Code
- Tunggu QR code muncul di terminal
- Scan dengan WhatsApp

#### 3. Test API Endpoints

**Test Send Message:**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "x-api-key: daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628XXXXXXXXX",
    "message": "Test dari API!"
  }'
```

**Test Send Reaction:**
```bash
curl -X POST http://localhost:3000/send-reaction \
  -H "x-api-key: daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a" \
  -H "Content-Type: application/json" \
  -d '{
    "remoteJid": "628XXXXXXXXX@s.whatsapp.net",
    "messageKey": {...},
    "emoji": "👍"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

---

### Method 3: Manual Testing dengan Code

#### 1. Buat File Test
```javascript
// test-manual.js
import { BaileysClass } from './lib/baileys.js';

const bot = new BaileysClass({});

bot.on('qr', (qr) => console.log('QR:', qr));
bot.on('ready', async () => {
    console.log('✅ Bot Ready!');
    
    // Test kirim pesan
    await bot.sendText('628XXXXXXXXX', 'Test message!');
    console.log('✅ Message sent!');
});
```

#### 2. Jalankan
```bash
node test-manual.js
```

---

## ✅ Checklist Testing

### Basic Features
- [ ] Bot connect (QR code scan berhasil)
- [ ] Bot ready (event 'ready' triggered)
- [ ] Terima pesan (event 'message' triggered)
- [ ] Kirim text message
- [ ] Kirim image
- [ ] Kirim video
- [ ] Kirim audio
- [ ] Kirim file
- [ ] Kirim sticker
- [ ] Kirim poll
- [ ] Kirim location
- [ ] Kirim contact

### Interactive Features (NEW)
- [ ] Send reaction
- [ ] Send list menu
- [ ] Send reply/quote
- [ ] Send mention
- [ ] Delete message
- [ ] Edit message

### Advanced Features (NEW)
- [ ] Send template
- [ ] Send interactive message
- [ ] Send live location
- [ ] Send multiple contacts
- [ ] Send group invite
- [ ] Forward message
- [ ] Send view once
- [ ] Pin message

### REST API
- [ ] POST /send-message works
- [ ] POST /send-to-group works
- [ ] POST /send-reaction works
- [ ] POST /send-list works
- [ ] POST /send-reply works
- [ ] POST /send-mention works
- [ ] POST /delete-message works
- [ ] POST /edit-message works

---

## 🐛 Troubleshooting

### Bot tidak connect
```bash
# Hapus session lama
rm -rf bot_sessions/

# Jalankan ulang
node examples/test-bot.js
```

### QR Code tidak muncul
```bash
# Install ulang dependencies
npm install

# Build ulang
npm run build

# Jalankan ulang
node examples/test-bot.js
```

### Error saat kirim pesan
- Pastikan nomor format benar: `628XXXXXXXXX`
- Pastikan bot sudah ready
- Check log error di console

### API tidak response
- Pastikan server running: `npm start`
- Check port 3000 tidak dipakai aplikasi lain
- Pastikan API key benar

---

## 📊 Expected Output

### Successful Connection
```
🤖 Starting WhatsApp Bot Test...

⏳ Waiting for QR code or connection...

📱 QR CODE RECEIVED!
Scan QR code di file: bot.qr.png
Atau lihat QR code di terminal di atas ☝️

✅ BOT IS READY!

Bot siap menerima pesan.
Kirim pesan "test" ke bot untuk mencoba fitur.
```

### Successful Message
```
📨 Pesan diterima dari: 628XXXXXXXXX@s.whatsapp.net
📝 Isi pesan: test
✅ Sent: Text message
```

---

## 🎯 Quick Test

Cara tercepat untuk test:

```bash
# 1. Jalankan test script
node examples/test-bot.js

# 2. Scan QR code

# 3. Kirim "test" ke bot dari HP Anda

# 4. Jika bot reply "✅ Bot berfungsi dengan baik!" 
#    berarti bot BERFUNGSI! ✅
```

---

## 📝 Notes

- **Session**: Bot akan menyimpan session di folder `bot_sessions/`
- **QR Code**: QR code akan expire setelah 1 menit, scan segera
- **Pairing Code**: Alternatif QR code, lihat README untuk cara pakai
- **Logs**: Check `combined.log` dan `error.log` untuk debugging

---

**Happy Testing! 🚀**
