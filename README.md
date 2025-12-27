# 🤖 WA Bot - Production-Ready WhatsApp Bot API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://www.typescriptlang.org/)
[![Baileys](https://img.shields.io/badge/Baileys-6.4.0-green.svg)](https://github.com/WhiskeySockets/Baileys)
[![Architecture](https://img.shields.io/badge/Architecture-MVC-brightgreen.svg)](./docs/REFACTORING-SUMMARY.md)

A **production-ready** WhatsApp bot API built with TypeScript using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). Features **52 REST API endpoints**, **modular MVC architecture**, and **real-time webhooks**.

---

## ✨ Features

### 🎯 Complete REST API (52 Endpoints)

#### Connection Management (5)
- ✅ QR Code & Pairing Code support
- ✅ Connection status monitoring
- ✅ Multi-device support
- ✅ Graceful disconnect

#### Messaging (10)
- ✅ Text messages
- ✅ Reactions & Mentions
- ✅ Reply & Forward
- ✅ List menus & Templates
- ✅ Edit & Delete messages

#### Media (7)
- ✅ Images, Videos, Audio
- ✅ Documents & Stickers
- ✅ Location & Contacts

#### Contact Management (8)
- ✅ List & Search contacts
- ✅ Block/Unblock
- ✅ Profile pictures
- ✅ Update bot profile

#### Group Management (14)
- ✅ Create & Manage groups
- ✅ Add/Remove participants
- ✅ Promote/Demote admins
- ✅ Update settings & invites

#### Webhooks (5)
- ✅ Real-time event notifications
- ✅ Signature verification
- ✅ Event filtering
- ✅ Enable/Disable controls

#### Bot Info (3)
- ✅ Bot information
- ✅ System statistics
- ✅ Uptime monitoring

### 🏗️ Modular Architecture
- **MVC Pattern** - Clean separation of concerns
- **24 Modular Files** - Average 58 lines per file
- **Easy to Test** - Unit testable controllers
- **Scalable** - Easy to add new features
- **Maintainable** - Well-organized codebase

### � Security
- API Key authentication
- Webhook signature verification
- Error handling & validation
- Session encryption

### � Monitoring
- Winston logging with timezone support
- Real-time webhooks
- System statistics
- Uptime tracking

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/pilarlabsid/wabot.git
cd wabot

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

## 🚀 Quick Start

### Using QR Code

```javascript
import { BaileysClass } from './lib/baileys.js';

const bot = new BaileysClass({});

bot.on('qr', (qr) => {
    console.log('Scan this QR code:', qr);
});

bot.on('ready', () => {
    console.log('Bot is ready!');
});

bot.on('message', async (msg) => {
    console.log('Received:', msg.body);
    await bot.sendText(msg.from, 'Hello!');
});
```

### Using Pairing Code

```javascript
const bot = new BaileysClass({ 
    usePairingCode: true, 
    phoneNumber: '628XXXXXXXXX' 
});

bot.on('pairing_code', (code) => {
    console.log('Pairing code:', code);
});
```

### Using Pairing Code

Alternative to QR Code - no camera needed!

```javascript
const bot = new BaileysClass({ 
    usePairingCode: true, 
    phoneNumber: '628XXXXXXXXX' 
});

bot.on('pairing_code', (code) => {
    console.log('Pairing code:', code);
    // Enter this code in WhatsApp
});
```

**Quick start with pairing code:**
```bash
npm run pairing
```

See [docs/guides/PAIRING-CODE.md](./docs/guides/PAIRING-CODE.md) for detailed guide.

## 📚 Documentation

Complete documentation available in the [`docs/`](./docs) folder:

### API Documentation
- [API Summary](./docs/API-SUMMARY.md) - Complete API overview with examples
- [Connection API](./docs/api/CONNECTION-API.md) - Connection management
- [Media API](./docs/api/MEDIA-API.md) - Media sending
- [Contact API](./docs/api/CONTACT-API.md) - Contact management
- [Webhook API](./docs/api/WEBHOOK-API.md) - Webhook system

### Guides
- [Pairing Code Guide](./docs/guides/PAIRING-CODE.md) - How to use pairing code
- [Testing Guide](./docs/guides/TESTING.md) - How to test the bot

### Architecture
- [Refactoring Summary](./docs/REFACTORING-SUMMARY.md) - Modular architecture details

**See [docs/README.md](./docs/README.md) for complete documentation index.**

## 📖 API Reference

### Core Methods

#### Connection
- `initBailey()` - Initialize WhatsApp connection
- `setUpBaileySock()` - Setup connection socket
- `handleConnectionUpdate()` - Handle connection updates

#### Basic Messaging
```javascript
// Send text
await bot.sendText('628xxx', 'Hello World');

// Send image
await bot.sendImage('628xxx', './image.jpg', 'Caption');

// Send video
await bot.sendVideo('628xxx', './video.mp4', 'Caption');

// Send audio
await bot.sendAudio('628xxx', './audio.mp3');

// Send file
await bot.sendFile('628xxx', './document.pdf');

// Send sticker
await bot.sendSticker('628xxx', 'https://example.com/sticker.gif', {
    pack: 'My Pack',
    author: 'Author'
});

// Send poll
await bot.sendPoll('628xxx', 'Choose option', {
    options: ['Option 1', 'Option 2', 'Option 3']
});

// Send location
await bot.sendLocation('628xxx@s.whatsapp.net', -6.200000, 106.816666);

// Send contact
await bot.sendContact('628xxx@s.whatsapp.net', '+628111', 'John Doe');
```

#### 🆕 Interactive Features
```javascript
// Send reaction
await bot.sendReaction('628xxx@s.whatsapp.net', messageKey, '❤️');

// Send list menu
await bot.sendList('628xxx', 'Menu Title', 'Choose an option', 'View Menu', [
    {
        title: 'Section 1',
        rows: [
            { title: 'Option 1', description: 'Description', rowId: '1' },
            { title: 'Option 2', description: 'Description', rowId: '2' }
        ]
    }
]);

// Reply to message
await bot.sendReply('628xxx', 'Thanks for your message!', quotedMessage);

// Mention users
await bot.sendMention('groupId@g.us', 'Hello @628111', ['628111@s.whatsapp.net']);

// Delete message
await bot.deleteMessage('628xxx@s.whatsapp.net', messageKey);

// Edit message
await bot.editMessage('628xxx@s.whatsapp.net', messageKey, 'Updated text');
```

#### 🚀 Advanced Features
```javascript
// Send template with buttons
await bot.sendTemplate('628xxx', {
    text: 'Check our website!',
    footer: 'Powered by Bot',
    buttons: [
        { type: 'url', text: 'Visit', url: 'https://example.com' },
        { type: 'call', text: 'Call Us', phoneNumber: '+628111' },
        { type: 'quick_reply', text: 'Quick Reply' }
    ]
});

// Send live location
await bot.sendLiveLocation('628xxx@s.whatsapp.net', -6.200000, 106.816666, 3600);

// Send multiple contacts
await bot.sendContactsArray('628xxx@s.whatsapp.net', [
    { displayName: 'John', phoneNumber: '+628111' },
    { displayName: 'Jane', phoneNumber: '+628222' }
]);

// Send group invite
await bot.sendGroupInvite('628xxx', 'groupId@g.us', 'inviteCode', 'Join us!');

// Forward message
await bot.forwardMessage('628xxx@s.whatsapp.net', messageObject);

// Send view once media
await bot.sendViewOnce('628xxx', './secret.jpg', 'View once!');

// Pin message
await bot.pinMessage('628xxx@s.whatsapp.net', messageKey, true);
```

## 🔌 REST API Endpoints

All endpoints require API key authentication via `x-api-key` header.

**API Key:** `daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a`

### Basic Endpoints

#### Send Message
```bash
POST /send-message
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "number": "628xxx",
  "message": "Hello World"
}
```

#### Send to Group
```bash
POST /send-to-group
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "groupId": "groupId@g.us",
  "message": "Hello Group"
}
```

### 🆕 Interactive Endpoints

#### Send Reaction
```bash
POST /send-reaction
{
  "remoteJid": "628xxx@s.whatsapp.net",
  "messageKey": {...},
  "emoji": "👍"
}
```

#### Send List
```bash
POST /send-list
{
  "number": "628xxx",
  "title": "Menu",
  "description": "Choose option",
  "buttonText": "View",
  "sections": [...]
}
```

#### Send Reply
```bash
POST /send-reply
{
  "number": "628xxx",
  "message": "Thanks!",
  "quotedMessage": {...}
}
```

#### Send Mention
```bash
POST /send-mention
{
  "remoteJid": "groupId@g.us",
  "message": "Hello @628xxx",
  "mentions": ["628xxx@s.whatsapp.net"]
}
```

#### Delete Message
```bash
POST /delete-message
{
  "remoteJid": "628xxx@s.whatsapp.net",
  "messageKey": {...}
}
```

#### Edit Message
```bash
POST /edit-message
{
  "remoteJid": "628xxx@s.whatsapp.net",
  "messageKey": {...},
  "newText": "Updated text"
}
```

#### Send Template
```bash
POST /send-template
{
  "number": "628xxx",
  "content": {
    "text": "Hello",
    "buttons": [...]
  }
}
```

#### Forward Message
```bash
POST /forward-message
{
  "toJid": "628xxx@s.whatsapp.net",
  "message": {...}
}
```

## 📝 Events

```javascript
bot.on('ready', () => {
    // Bot is ready
});

bot.on('qr', (qr) => {
    // QR code received
});

bot.on('pairing_code', (code) => {
    // Pairing code received
});

bot.on('message', (msg) => {
    // New message received
    // msg.from - Sender ID
    // msg.body - Message text
    // msg.type - Message type (text, image, video, etc)
});

bot.on('auth_failure', (error) => {
    // Authentication failed
});
```

## 🛠️ Configuration

### Constructor Options

```javascript
const bot = new BaileysClass({
    name: 'bot',              // Session name (default: 'bot')
    usePairingCode: false,    // Use pairing code instead of QR (default: false)
    phoneNumber: null,        // Phone number for pairing code
    gifPlayback: false,       // Enable GIF playback (default: false)
    dir: './',                // Session directory (default: './')
    debug: false              // Enable debug logging (default: false)
});
```

## 📁 Project Structure

```
wabot/
├── src/
│   ├── baileys.ts          # Main BaileysClass implementation
│   └── utils.ts            # Utility functions
├── lib/                    # Compiled JavaScript (generated)
├── public/
│   └── notification.ts     # REST API server
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Build
```bash
npm run build
```

### Start Server
```bash
npm start
```

### Environment Variables
```bash
PORT=3000  # Server port (default: 3000)
```

## 📊 Logging

The bot uses Winston for logging with Jakarta timezone (GMT+7):
- `combined.log` - All logs
- `error.log` - Error logs only
- Console output with colors

## 🤝 Integration with bot-whatsapp

This library can be used as a provider for [bot-whatsapp](https://bot-whatsapp.netlify.app/docs):

```javascript
const { BaileysClass } = require('./lib/baileys');
const { createProvider } = require('@bot-whatsapp/bot');

const adapterProvider = createProvider(BaileysClass);

// With pairing code
const adapterProvider = createProvider(BaileysClass, { 
    usePairingCode: true, 
    phoneNumber: '628XXXXXXXXX' 
});
```

## 🐛 Troubleshooting

### TypeScript Errors in IDE
If you see module import errors in your IDE, run:
```bash
npm install
```

These errors are normal in development environments without installed dependencies.

### Connection Issues
- Make sure WhatsApp is not connected on another device
- Clear session folder: `rm -rf bot_sessions`
- Try using pairing code instead of QR

### Build Errors
```bash
# Clean and rebuild
rm -rf lib/
npm run build
```

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 👤 Author

**Ujang Supriyadi**
- GitHub: [@ujangsprr](https://github.com/ujangsprr)

## 🙏 Acknowledgements

This project was inspired by:
- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [bot-whatsapp](https://github.com/codigoencasa/bot-whatsapp) - Bot framework

## 🌟 Project Status

### ✅ Completed (v2.0.0)

| Feature | Status | Details |
|---------|--------|---------|
| REST API Endpoints | ✅ Complete | 52 endpoints across 7 categories |
| Modular Architecture | ✅ Complete | MVC pattern, 24 files |
| Webhooks | ✅ Complete | Real-time notifications |
| Documentation | ✅ Complete | 9 docs in organized structure |
| Security | ✅ Complete | API key + webhook signatures |
| TypeScript | ✅ Complete | Full type safety |

---

## 🗺️ Roadmap

### 📅 Phase 1: Core Enhancements (Q1 2025)

#### Testing & Quality
- [ ] **Unit Tests** - Controller & service tests
- [ ] **Integration Tests** - API endpoint tests
- [ ] **E2E Tests** - Full workflow tests
- [ ] **Test Coverage** - Target 80%+

#### Security Enhancements
- [ ] **JWT Authentication** - Token-based auth
- [ ] **Rate Limiting** - Prevent API abuse
- [ ] **Request Validation** - Input sanitization
- [ ] **CORS Configuration** - Cross-origin security
- [ ] **Helmet.js** - Security headers

### 📅 Phase 2: Advanced Features (Q2 2025)

#### Database Integration
- [ ] **Message History** - Store & retrieve messages
- [ ] **Contact Database** - Persistent contact storage
- [ ] **Analytics** - Usage statistics & metrics
- [ ] **Session Management** - Multi-session support

#### Message Features
- [ ] **Message Queue** - Bulk message sending
- [ ] **Scheduled Messages** - Send messages later
- [ ] **Auto-Reply** - Automated responses
- [ ] **Chatbot Integration** - AI-powered responses

### 📅 Phase 3: Enterprise Features (Q3 2025)

#### Scalability
- [ ] **Docker Support** - Containerization
- [ ] **Kubernetes** - Orchestration
- [ ] **Load Balancing** - Multiple instances
- [ ] **Redis Cache** - Performance optimization

#### Monitoring & Observability
- [ ] **Prometheus Metrics** - System metrics
- [ ] **Grafana Dashboards** - Visual monitoring
- [ ] **Error Tracking** - Sentry integration
- [ ] **Performance Monitoring** - APM integration

### � Phase 4: Developer Experience (Q4 2025)

#### SDK & Libraries
- [ ] **JavaScript SDK** - Easy integration
- [ ] **Python SDK** - Python support
- [ ] **PHP SDK** - PHP support
- [ ] **CLI Tool** - Command-line interface

#### Documentation & Examples
- [ ] **Interactive API Docs** - Swagger/OpenAPI
- [ ] **Video Tutorials** - Step-by-step guides
- [ ] **Code Examples** - Real-world use cases
- [ ] **Postman Collection** - API testing

### 🔮 Future Considerations

#### Advanced Integrations
- [ ] **CRM Integration** - Salesforce, HubSpot
- [ ] **E-commerce** - Shopify, WooCommerce
- [ ] **Payment Gateways** - Stripe, PayPal
- [ ] **Cloud Storage** - S3, Google Cloud

#### AI & Automation
- [ ] **Natural Language Processing** - Intent detection
- [ ] **Sentiment Analysis** - Message analysis
- [ ] **Smart Routing** - Intelligent message routing
- [ ] **Predictive Analytics** - Usage predictions

---

## 📈 Version History

### v2.0.0 (Current) - December 2025
- ✅ **Modular Architecture** - Refactored to MVC pattern
- ✅ **52 API Endpoints** - Complete REST API
- ✅ **Webhooks** - Real-time event notifications
- ✅ **Documentation** - Organized docs/ folder
- ✅ **24 Modular Files** - Clean code structure

### v1.0.0 - November 2025
- ✅ **28 Message Types** - 100% coverage
- ✅ **10 API Endpoints** - Basic REST API
- ✅ **TypeScript** - Full type safety
- ✅ **Pairing Code** - Alternative auth method

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Priority Areas
1. **Testing** - Write unit & integration tests
2. **Documentation** - Improve guides & examples
3. **Bug Fixes** - Report & fix issues
4. **Features** - Implement roadmap items

### How to Contribute
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 👤 Author

**Ujang Supriyadi**
- GitHub: [@ujangsprr](https://github.com/ujangsprr)

## 🙏 Acknowledgements

This project was inspired by:
- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [bot-whatsapp](https://github.com/codigoencasa/bot-whatsapp) - Bot framework

---

**Made with ❤️ for the WhatsApp Bot community**

**⭐ Star this repo if you find it useful!**
