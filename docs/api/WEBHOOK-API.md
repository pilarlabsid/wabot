# Webhook System Documentation

## Overview

Webhook system memungkinkan frontend menerima real-time notifications saat ada events dari WhatsApp bot (pesan masuk, perubahan koneksi, dll) via HTTP POST requests.

---

## 🎯 How Webhooks Work

```
1. Frontend configures webhook URL
2. Bot events occur (message received, connection update, etc)
3. Bot sends HTTP POST to webhook URL
4. Frontend receives and processes event
```

---

## 📡 Webhook Events

### Available Events:

| Event | Description | Trigger |
|-------|-------------|---------|
| `message.received` | New message received | When bot receives a message |
| `connection.ready` | Bot connected | When bot successfully connects |
| `qr.update` | New QR code | When new QR code is generated |
| `pairing.code` | Pairing code received | When pairing code is generated |
| `auth.failure` | Authentication failed | When auth fails |

### Subscribe to Events:

```javascript
// Subscribe to specific events
{
  "events": ["message.received", "connection.ready"]
}

// Subscribe to all events
{
  "events": ["*"]
}
```

---

## 🔧 API Endpoints

### 1. Configure Webhook

**POST** `/webhooks/configure`

Setup webhook URL and events to listen to.

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhook",
  "secret": "your_webhook_secret",
  "events": ["*"]
}
```

**Parameters:**
- `url` (required) - Your webhook endpoint URL
- `secret` (optional) - Secret for signature verification
- `events` (optional) - Array of events to subscribe to. Default: `["*"]` (all events)

**Response:**
```json
{
  "success": true,
  "message": "Webhook configured successfully",
  "data": {
    "url": "https://yourapp.com/webhook",
    "events": ["*"],
    "hasSecret": true
  }
}
```

---

### 2. Get Webhook Status

**GET** `/webhooks/status`

Check current webhook configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "enabled": true,
    "url": "https://yourapp.com/webhook",
    "events": ["*"],
    "hasSecret": true
  }
}
```

---

### 3. Disable Webhook

**POST** `/webhooks/disable`

Temporarily disable webhook without removing configuration.

**Response:**
```json
{
  "success": true,
  "message": "Webhook disabled successfully"
}
```

---

### 4. Enable Webhook

**POST** `/webhooks/enable`

Re-enable previously disabled webhook.

**Response:**
```json
{
  "success": true,
  "message": "Webhook enabled successfully"
}
```

---

### 5. Test Webhook

**POST** `/webhooks/test`

Send test event to verify webhook is working.

**Response:**
```json
{
  "success": true,
  "message": "Test webhook sent successfully"
}
```

---

## 📨 Webhook Payload Format

All webhook requests will be sent as HTTP POST with this format:

```json
{
  "event": "message.received",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

### Headers:
```
Content-Type: application/json
X-Webhook-Event: message.received
X-Webhook-Signature: sha256_signature (if secret configured)
```

---

## 📋 Event Payloads

### message.received
```json
{
  "event": "message.received",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    "from": "628xxx@s.whatsapp.net",
    "message": "Hello!",
    "messageId": "ABC123",
    "isGroup": false
  }
}
```

### connection.ready
```json
{
  "event": "connection.ready",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    "status": "connected"
  }
}
```

### qr.update
```json
{
  "event": "qr.update",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    "qrCode": "2@abc123...",
    "timestamp": "2025-12-27T05:00:00.000Z"
  }
}
```

### pairing.code
```json
{
  "event": "pairing.code",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    "pairingCode": "ABCD-EFGH",
    "timestamp": "2025-12-27T05:00:00.000Z"
  }
}
```

### auth.failure
```json
{
  "event": "auth.failure",
  "timestamp": "2025-12-27T05:00:00.000Z",
  "data": {
    "error": "Connection closed",
    "timestamp": "2025-12-27T05:00:00.000Z"
  }
}
```

---

## 🔐 Signature Verification

If you configure a `secret`, all webhook requests will include `X-Webhook-Signature` header.

### Verify Signature (Node.js):
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Usage in your webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your_webhook_secret';
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).json({ received: true });
});
```

---

## 🎨 Frontend Integration Examples

### Express.js Webhook Receiver

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  console.log(`[${timestamp}] Event: ${event}`);
  
  switch(event) {
    case 'message.received':
      console.log(`New message from ${data.from}: ${data.message}`);
      // Update UI, send notification, etc
      break;
      
    case 'connection.ready':
      console.log('Bot is connected!');
      // Update connection status in UI
      break;
      
    case 'qr.update':
      console.log('New QR code available');
      // Display new QR code
      break;
  }
  
  res.status(200).json({ received: true });
});

app.listen(4000, () => {
  console.log('Webhook receiver running on port 4000');
});
```

---

### Next.js API Route

```typescript
// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { event, data } = req.body;
  
  // Handle different events
  if (event === 'message.received') {
    // Store in database
    await db.messages.create({
      from: data.from,
      message: data.message,
      timestamp: data.timestamp
    });
    
    // Send push notification
    await sendPushNotification({
      title: 'New Message',
      body: data.message
    });
  }
  
  res.status(200).json({ received: true });
}
```

---

### React Real-time Updates

```javascript
// Configure webhook to your backend
useEffect(() => {
  const configureWebhook = async () => {
    await fetch('http://localhost:3000/webhooks/configure', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://myapp.com/api/webhook',
        secret: 'my_secret',
        events: ['message.received', 'connection.ready']
      })
    });
  };
  
  configureWebhook();
}, []);

// Listen to webhook events via WebSocket/SSE from your backend
useEffect(() => {
  const ws = new WebSocket('wss://myapp.com/ws');
  
  ws.onmessage = (event) => {
    const { event: eventType, data } = JSON.parse(event.data);
    
    if (eventType === 'message.received') {
      setMessages(prev => [...prev, data]);
    }
  };
  
  return () => ws.close();
}, []);
```

---

## 🚀 Quick Start

### Step 1: Configure Webhook
```bash
curl -X POST http://localhost:3000/webhooks/configure \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhook",
    "secret": "your_secret",
    "events": ["*"]
  }'
```

### Step 2: Test Webhook
```bash
curl -X POST http://localhost:3000/webhooks/test \
  -H "x-api-key: YOUR_API_KEY"
```

### Step 3: Check Status
```bash
curl -X GET http://localhost:3000/webhooks/status \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 💡 Best Practices

1. **Use HTTPS** - Always use HTTPS for webhook URLs in production
2. **Verify Signatures** - Always verify webhook signatures if using secret
3. **Handle Retries** - Implement retry logic for failed webhook deliveries
4. **Idempotency** - Make webhook handlers idempotent (safe to receive same event multiple times)
5. **Quick Response** - Respond quickly (< 5s) to webhook requests
6. **Async Processing** - Process webhook data asynchronously
7. **Monitor** - Log all webhook deliveries and failures

---

## 🐛 Troubleshooting

### Webhook not receiving events
```bash
# Check webhook status
curl -X GET http://localhost:3000/webhooks/status \
  -H "x-api-key: YOUR_API_KEY"

# Test webhook
curl -X POST http://localhost:3000/webhooks/test \
  -H "x-api-key: YOUR_API_KEY"
```

### Invalid signature errors
- Ensure secret matches on both sides
- Verify payload is not modified before verification
- Check signature is computed correctly

### Webhook timeouts
- Ensure webhook endpoint responds quickly (< 5s)
- Process data asynchronously
- Return 200 OK immediately

---

**Happy Coding! 🚀**
