# Media API Documentation

## Overview

API endpoints untuk mengirim berbagai jenis media (gambar, video, audio, dokumen, sticker, lokasi, kontak) via WhatsApp.

---

## 📡 Endpoints

### 1. Send Image

**POST** `/send-image`

Kirim gambar ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check this out!" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image sent successfully"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/send-image \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "imageUrl": "https://picsum.photos/800/600",
    "caption": "Random image"
  }'
```

---

### 2. Send Video

**POST** `/send-video`

Kirim video ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Watch this!" // optional
}
```

**Supported Formats:** MP4, AVI, MOV, MKV

---

### 3. Send Audio

**POST** `/send-audio`

Kirim audio/voice note ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "audioUrl": "https://example.com/audio.mp3"
}
```

**Supported Formats:** MP3, OGG, WAV, M4A

**Note:** Audio akan dikirim sebagai voice note (playable di chat).

---

### 4. Send Document

**POST** `/send-document`

Kirim file/dokumen ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "documentUrl": "https://example.com/document.pdf",
  "filename": "report.pdf", // optional
  "mimetype": "application/pdf" // optional
}
```

**Supported Formats:** PDF, DOC, DOCX, XLS, XLSX, PPT, ZIP, RAR, etc.

---

### 5. Send Sticker

**POST** `/send-sticker`

Kirim sticker ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "stickerUrl": "https://example.com/sticker.webp"
}
```

**Requirements:**
- Format: WEBP
- Size: Max 100KB
- Dimensions: 512x512px (recommended)

---

### 6. Send Location

**POST** `/send-location`

Kirim lokasi/koordinat ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "latitude": -6.200000,
  "longitude": 106.816666,
  "address": "Jakarta, Indonesia" // optional
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/send-location \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "latitude": -6.200000,
    "longitude": 106.816666,
    "address": "Jakarta"
  }'
```

---

### 7. Send Contact

**POST** `/send-contact`

Kirim kontak/vCard ke nomor WhatsApp.

**Request Body:**
```json
{
  "number": "628123456789",
  "contactName": "John Doe",
  "contactNumber": "628987654321"
}
```

---

## 🎨 Frontend Integration Examples

### React Example

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const API_KEY = 'your_api_key_here';

// Send Image
const sendImage = async (number, imageUrl, caption) => {
  try {
    const response = await axios.post(`${API_URL}/send-image`, {
      number,
      imageUrl,
      caption
    }, {
      headers: { 'x-api-key': API_KEY }
    });
    
    console.log('Image sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Send Video
const sendVideo = async (number, videoUrl, caption) => {
  await axios.post(`${API_URL}/send-video`, {
    number,
    videoUrl,
    caption
  }, {
    headers: { 'x-api-key': API_KEY }
  });
};

// Usage
sendImage('628123456789', 'https://picsum.photos/800', 'Hello!');
```

---

### Vue.js Example

```javascript
export default {
  methods: {
    async sendMedia(type, number, url, options = {}) {
      const endpoint = `/send-${type}`;
      const payload = { number, [`${type}Url`]: url, ...options };
      
      try {
        const { data } = await this.$axios.post(endpoint, payload, {
          headers: { 'x-api-key': process.env.VUE_APP_API_KEY }
        });
        
        this.$toast.success('Media sent successfully!');
        return data;
      } catch (error) {
        this.$toast.error('Failed to send media');
        throw error;
      }
    }
  }
}

// Usage
this.sendMedia('image', '628xxx', 'https://...', { caption: 'Hi!' });
this.sendMedia('video', '628xxx', 'https://...');
this.sendMedia('document', '628xxx', 'https://...');
```

---

### React Native Example

```javascript
import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';

const MediaSender = () => {
  const [uploading, setUploading] = useState(false);
  
  const pickAndSendImage = async (number) => {
    // Pick image from gallery
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8
    });
    
    if (result.assets && result.assets[0]) {
      setUploading(true);
      
      // Upload to your server/cloud first
      const imageUrl = await uploadToServer(result.assets[0].uri);
      
      // Send via WhatsApp API
      await fetch('http://yourserver.com/send-image', {
        method: 'POST',
        headers: {
          'x-api-key': 'YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number,
          imageUrl,
          caption: 'Sent from mobile app'
        })
      });
      
      setUploading(false);
    }
  };
  
  return (
    <Button 
      title="Send Image" 
      onPress={() => pickAndSendImage('628xxx')}
      disabled={uploading}
    />
  );
};
```

---

## 📤 File Upload Flow

### Recommended Flow:

```
1. User selects file in frontend
2. Upload file to your server/cloud storage (S3, Cloudinary, etc)
3. Get public URL
4. Send URL to WhatsApp API
5. WhatsApp downloads and sends the file
```

### Example with File Upload:

```javascript
// Step 1: Upload file to server
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { url } = await response.json();
  return url;
};

// Step 2: Send to WhatsApp
const sendFileToWhatsApp = async (number, file, type) => {
  // Upload first
  const fileUrl = await uploadFile(file);
  
  // Then send via WhatsApp
  await fetch(`/send-${type}`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number,
      [`${type}Url`]: fileUrl
    })
  });
};

// Usage
const file = document.getElementById('fileInput').files[0];
await sendFileToWhatsApp('628xxx', file, 'image');
```

---

## 🔒 Security Best Practices

### 1. Validate File URLs
```javascript
// Backend validation
const isValidUrl = (url) => {
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

if (!isValidUrl(imageUrl)) {
  return res.status(400).json({ error: 'Invalid URL' });
}
```

### 2. File Size Limits
```javascript
// Check file size before sending
const MAX_SIZE = 16 * 1024 * 1024; // 16MB

const checkFileSize = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  const size = parseInt(response.headers.get('content-length'));
  return size <= MAX_SIZE;
};
```

### 3. Content Type Validation
```javascript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi'];

// Validate before sending
const response = await fetch(url, { method: 'HEAD' });
const contentType = response.headers.get('content-type');

if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
  throw new Error('Invalid file type');
}
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 403 | Forbidden (invalid API key) |
| 500 | Server Error (failed to send) |

---

## 💡 Tips & Best Practices

1. **Use CDN URLs** - Faster download for WhatsApp servers
2. **Optimize Images** - Compress before uploading
3. **Validate URLs** - Always check URL validity
4. **Handle Errors** - Implement retry logic
5. **Monitor Usage** - Track API calls and file sizes

---

**Happy Coding! 🚀**
