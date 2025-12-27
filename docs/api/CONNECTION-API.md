# 🔌 Connection Management API

## Overview

API untuk manage koneksi WhatsApp bot secara dinamis melalui REST API. Support QR Code dan Pairing Code.

---

## 🔐 Authentication

Semua endpoint memerlukan API key di header:
```
x-api-key: daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a
```

---

## 📡 Endpoints

### 1. Get Connection Status

**GET** `/connection/status`

Cek status koneksi bot saat ini.

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "hasQRCode": false,
    "hasPairingCode": false,
    "phoneNumber": null,
    "lastQRUpdate": "2025-12-27T05:00:00.000Z",
    "lastPairingUpdate": null
  }
}
```

**Use Case:**
- Monitor bot status
- Check apakah perlu re-connect
- Polling untuk QR/pairing code availability

---

### 2. Get QR Code

**GET** `/connection/qr`

Dapatkan QR code string untuk di-scan.

**Response Success:**
```json
{
  "success": true,
  "data": {
    "qrCode": "2@WsYovQD+qnbgd1tsGtBKn2N9ZBo96rx...",
    "timestamp": "2025-12-27T05:00:00.000Z",
    "expiresIn": "60 seconds"
  }
}
```

**Response Error (No QR):**
```json
{
  "success": false,
  "error": "No QR code available. Bot might already be connected."
}
```

**Use Case:**
- Display QR di web dashboard
- Convert ke QR image dengan library
- Auto-refresh setiap 60 detik

**Example (Frontend):**
```javascript
// Polling QR code
setInterval(async () => {
  const response = await fetch('http://localhost:3000/connection/qr', {
    headers: { 'x-api-key': 'YOUR_API_KEY' }
  });
  const data = await response.json();
  
  if (data.success) {
    // Generate QR image dari string
    const qrImage = await QRCode.toDataURL(data.data.qrCode);
    document.getElementById('qr').src = qrImage;
  }
}, 20000); // Refresh setiap 20 detik
```

---

### 3. Request Pairing Code

**POST** `/connection/pairing`

Request pairing code untuk nomor tertentu.

**Request Body:**
```json
{
  "phoneNumber": "628123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "To use pairing code, restart server with USE_PAIRING_CODE=true",
  "instruction": "Run: USE_PAIRING_CODE=true PHONE_NUMBER=628123456789 npm start"
}
```

**Note:** 
- Pairing code mode requires server restart
- Untuk production, implement auto-restart mechanism

---

### 4. Get Current Pairing Code

**GET** `/connection/pairing`

Dapatkan pairing code yang sedang aktif (jika server running dalam pairing mode).

**Response Success:**
```json
{
  "success": true,
  "data": {
    "pairingCode": "ABCD-EFGH",
    "phoneNumber": "628123456789",
    "timestamp": "2025-12-27T05:00:00.000Z",
    "expiresIn": "60 seconds"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "No pairing code available. Start server with pairing mode enabled."
}
```

---

### 5. Disconnect/Logout

**POST** `/connection/disconnect`

Logout dan clear session bot.

**Response:**
```json
{
  "success": true,
  "message": "Disconnected successfully. Scan QR or use pairing code to reconnect."
}
```

**Use Case:**
- Logout dari dashboard
- Reset connection
- Switch account

---

## 🚀 Usage Examples

### Example 1: Web Dashboard with QR Code

```html
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
</head>
<body>
    <h1>WhatsApp Bot Connection</h1>
    <div id="status"></div>
    <canvas id="qr"></canvas>
    
    <script>
        const API_KEY = 'daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a';
        const API_URL = 'http://localhost:3000';
        
        async function checkStatus() {
            const res = await fetch(`${API_URL}/connection/status`, {
                headers: { 'x-api-key': API_KEY }
            });
            const data = await res.json();
            
            document.getElementById('status').innerHTML = 
                data.data.isConnected ? 
                '✅ Connected' : 
                '❌ Disconnected - Scan QR below';
            
            if (!data.data.isConnected && data.data.hasQRCode) {
                await displayQR();
            }
        }
        
        async function displayQR() {
            const res = await fetch(`${API_URL}/connection/qr`, {
                headers: { 'x-api-key': API_KEY }
            });
            const data = await res.json();
            
            if (data.success) {
                const canvas = document.getElementById('qr');
                QRCode.toCanvas(canvas, data.data.qrCode);
            }
        }
        
        // Check status every 5 seconds
        setInterval(checkStatus, 5000);
        checkStatus();
    </script>
</body>
</html>
```

---

### Example 2: Mobile App Integration

```javascript
// React Native / Flutter
class WhatsAppBotService {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    
    async getConnectionStatus() {
        const response = await fetch(`${this.baseUrl}/connection/status`, {
            headers: { 'x-api-key': this.apiKey }
        });
        return response.json();
    }
    
    async getQRCode() {
        const response = await fetch(`${this.baseUrl}/connection/qr`, {
            headers: { 'x-api-key': this.apiKey }
        });
        return response.json();
    }
    
    async disconnect() {
        const response = await fetch(`${this.baseUrl}/connection/disconnect`, {
            method: 'POST',
            headers: { 'x-api-key': this.apiKey }
        });
        return response.json();
    }
}

// Usage
const bot = new WhatsAppBotService('YOUR_API_KEY', 'http://localhost:3000');

// Check if connected
const status = await bot.getConnectionStatus();
if (!status.data.isConnected) {
    // Show QR code
    const qr = await bot.getQRCode();
    displayQRCode(qr.data.qrCode);
}
```

---

### Example 3: Auto-Reconnect Script

```javascript
// auto-reconnect.js
const axios = require('axios');

const API_KEY = 'daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a';
const API_URL = 'http://localhost:3000';

async function monitorConnection() {
    try {
        const { data } = await axios.get(`${API_URL}/connection/status`, {
            headers: { 'x-api-key': API_KEY }
        });
        
        if (!data.data.isConnected) {
            console.log('❌ Bot disconnected!');
            
            if (data.data.hasQRCode) {
                const qr = await axios.get(`${API_URL}/connection/qr`, {
                    headers: { 'x-api-key': API_KEY }
                });
                
                console.log('📱 QR Code:', qr.data.data.qrCode);
                // Send notification (email, SMS, Telegram, etc)
                await sendAlert('Bot disconnected! Scan QR code to reconnect.');
            }
        } else {
            console.log('✅ Bot connected');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Check every 30 seconds
setInterval(monitorConnection, 30000);
```

---

## 🔄 Connection Flow

### Flow 1: QR Code (Default)

```
1. Start server: npm start
2. GET /connection/status → isConnected: false, hasQRCode: true
3. GET /connection/qr → Get QR string
4. Display QR in frontend
5. User scans with WhatsApp
6. GET /connection/status → isConnected: true ✅
```

### Flow 2: Pairing Code

```
1. Start server: USE_PAIRING_CODE=true PHONE_NUMBER=628xxx npm start
2. GET /connection/status → hasPairingCode: true
3. GET /connection/pairing → Get pairing code
4. Display code in frontend
5. User enters code in WhatsApp
6. GET /connection/status → isConnected: true ✅
```

### Flow 3: Disconnect & Reconnect

```
1. POST /connection/disconnect
2. Session cleared
3. GET /connection/qr or /connection/pairing
4. Reconnect with new QR/code
```

---

## 🛠️ Environment Variables

```bash
# .env
PORT=3000
API_KEY=your_api_key_here

# For pairing code mode
USE_PAIRING_CODE=true
PHONE_NUMBER=628XXXXXXXXX
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 403 | Forbidden (invalid API key) |
| 404 | Not Found (no QR/pairing code available) |
| 500 | Server Error |

---

## 🔒 Security Notes

- Always use HTTPS in production
- Rotate API keys regularly
- Implement rate limiting
- Log all connection attempts
- Monitor for suspicious activity

---

## 💡 Best Practices

1. **Polling Interval:** Check status every 5-10 seconds
2. **QR Refresh:** Refresh QR every 20 seconds (expires in 60s)
3. **Error Handling:** Always handle 404 responses
4. **Timeout:** Set request timeout to 10 seconds
5. **Retry Logic:** Implement exponential backoff

---

**Happy Coding! 🚀**
