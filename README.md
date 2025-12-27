# 🤖 WA Bot - Production-Ready WhatsApp Bot API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://www.typescriptlang.org/)
[![Baileys](https://img.shields.io/badge/Baileys-6.4.0-green.svg)](https://github.com/WhiskeySockets/Baileys)
[![Architecture](https://img.shields.io/badge/Architecture-MVC-brightgreen.svg)](./docs/PROJECT-STRUCTURE.md)

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

### 🔐 Security
- API Key authentication
- Webhook signature verification
- Error handling & validation
- Session encryption

### 📊 Monitoring
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

### 1. Start Server

```bash
# Start with QR Code (default)
npm start

# Or start with Pairing Code
npm run pairing
```

### 2. Connect WhatsApp

**Option A: QR Code**
- Scan QR code shown in terminal with WhatsApp
- Go to WhatsApp → Settings → Linked Devices → Link a Device

**Option B: Pairing Code**
- Enter 8-digit code shown in terminal  
- Go to WhatsApp → Settings → Linked Devices → Link with Phone Number

See [docs/guides/PAIRING-CODE.md](./docs/guides/PAIRING-CODE.md) for detailed guide.

### 3. Use REST API

```bash
# Send a message
curl -X POST http://localhost:3000/api/messaging/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a" \
  -d '{
    "to": "628xxx@s.whatsapp.net",
    "type": "text",
    "text": "Hello from WA Bot!"
  }'
```

**✅ Done! Your bot is ready to use.**

---

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
- [Project Structure](./docs/PROJECT-STRUCTURE.md) - Complete project structure

**See [docs/README.md](./docs/README.md) for complete documentation index.**

---

## 🔌 REST API Overview

All endpoints require API key authentication via `x-api-key` header.

**Base URL:** `http://localhost:3000/api`  
**API Key:** `daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a`

### API Categories

| Category | Endpoints | Documentation |
|----------|-----------|---------------|
| Connection | 5 | [Connection API](./docs/api/CONNECTION-API.md) |
| Messaging | 10 | [API Summary](./docs/API-SUMMARY.md) |
| Media | 7 | [Media API](./docs/api/MEDIA-API.md) |
| Contacts | 8 | [Contact API](./docs/api/CONTACT-API.md) |
| Groups | 14 | [API Summary](./docs/API-SUMMARY.md) |
| Webhooks | 5 | [Webhook API](./docs/api/WEBHOOK-API.md) |
| Bot Info | 3 | [API Summary](./docs/API-SUMMARY.md) |

**Total: 52 Endpoints**

### Quick API Examples

#### Send Text Message
```bash
POST /api/messaging/send
{
  "to": "628xxx@s.whatsapp.net",
  "type": "text",
  "text": "Hello World!"
}
```

#### Send Image
```bash
POST /api/media/image
{
  "to": "628xxx@s.whatsapp.net",
  "image": "https://example.com/image.jpg",
  "caption": "Check this out!"
}
```

#### Get Connection Status
```bash
GET /api/connection/status
```

#### Configure Webhook
```bash
POST /api/webhooks/configure
{
  "url": "https://your-server.com/webhook",
  "events": ["message", "connection"],
  "secret": "your-secret-key"
}
```

**See [docs/API-SUMMARY.md](./docs/API-SUMMARY.md) for complete API reference with all 52 endpoints.**

---

## 📁 Project Structure

```
wabot/
├── docs/                       # 📚 Documentation
│   ├── api/                    # API endpoint docs
│   └── guides/                 # How-to guides
│
├── public/                     # 🚀 Modular server
│   ├── server.ts               # Main entry point
│   ├── config/                 # Configuration
│   ├── middleware/             # Express middleware
│   ├── services/               # Business logic
│   ├── controllers/            # Request handlers
│   ├── routes/                 # Route definitions
│   └── types/                  # TypeScript types
│
├── src/                        # 🔧 Core library
│   ├── baileys.ts              # Baileys wrapper
│   └── utils.ts                # Utilities
│
└── lib/                        # Compiled JavaScript
```

See [docs/PROJECT-STRUCTURE.md](./docs/PROJECT-STRUCTURE.md) for detailed structure.

---

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000                                    # Server port (default: 3000)
API_KEY=your-api-key-here                   # API authentication key

# WhatsApp Configuration  
USE_PAIRING_CODE=false                      # Use pairing code (default: false)
PHONE_NUMBER=628XXXXXXXXX                   # Phone number for pairing

# Webhook Configuration (optional)
WEBHOOK_URL=https://your-server.com/webhook
WEBHOOK_SECRET=your-webhook-secret
```

### API Key

Default API key: `daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a`

**⚠️ Change this in production!**

---

## 📊 Monitoring & Logging

### Winston Logging

Logs are stored in:
- `combined.log` - All logs
- `error.log` - Error logs only
- Console output with colors

### System Statistics

```bash
GET /api/bot/stats
```

Returns:
- Uptime
- Memory usage
- Message count
- Connection status

---

## 🔒 Security

### Authentication
- API Key required for all endpoints
- Header: `x-api-key: YOUR_API_KEY`

### Webhook Security
- HMAC-SHA256 signature verification
- Secret key validation
- Event filtering

### Best Practices
- Change default API key
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs

---

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Errors in IDE
```bash
npm install
```

#### Connection Issues
- Make sure WhatsApp is not connected on another device
- Clear session folder: `rm -rf bot_sessions`
- Try using pairing code instead of QR

#### Build Errors
```bash
# Clean and rebuild
rm -rf lib/
npm run build
```

#### API Authentication Errors
- Check `x-api-key` header is set correctly
- Verify API key matches server configuration

---

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

### 📅 Phase 4: Developer Experience (Q4 2025)

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
