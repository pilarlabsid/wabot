# 📁 Project Structure

Complete WhatsApp Bot API with clean, modular architecture.

---

## 📂 Directory Structure

```
wabot/
├── README.md                    # Main project documentation
├── LICENSE.md                   # MIT License
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
│
├── docs/                        # 📚 All documentation
│   ├── README.md                # Documentation index
│   ├── API-SUMMARY.md           # Complete API overview
│   ├── REFACTORING-SUMMARY.md   # Architecture details
│   │
│   ├── api/                     # API endpoint docs
│   │   ├── CONNECTION-API.md
│   │   ├── MEDIA-API.md
│   │   ├── CONTACT-API.md
│   │   └── WEBHOOK-API.md
│   │
│   └── guides/                  # How-to guides
│       ├── PAIRING-CODE.md
│       └── TESTING.md
│
├── public/                      # 🚀 Modular server code
│   ├── server.ts                # Main entry point (33 lines)
│   ├── server-legacy.ts         # Old monolithic (backup)
│   │
│   ├── config/                  # Configuration
│   │   └── logger.ts
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   │
│   ├── services/                # Business logic
│   │   ├── botService.ts
│   │   ├── webhookService.ts
│   │   └── statsService.ts
│   │
│   ├── controllers/             # Request handlers
│   │   ├── connectionController.ts
│   │   ├── webhookController.ts
│   │   ├── botController.ts
│   │   ├── messagingController.ts
│   │   ├── mediaController.ts
│   │   ├── contactController.ts
│   │   └── groupController.ts
│   │
│   ├── routes/                  # Route definitions
│   │   ├── index.ts
│   │   ├── connection.ts
│   │   ├── webhooks.ts
│   │   ├── bot.ts
│   │   ├── messaging.ts
│   │   ├── media.ts
│   │   ├── contacts.ts
│   │   └── groups.ts
│   │
│   └── types/                   # TypeScript types
│       └── index.ts
│
├── src/                         # 🔧 Core library
│   ├── baileys.ts               # Baileys wrapper class
│   └── utils.ts                 # Utility functions
│
├── lib/                         # Compiled JavaScript
│   └── baileys.js
│
├── bot_sessions/                # Session data (gitignored)
│
├── pairing-code.js              # Pairing code script
├── test-bot.js                  # Test script
│
└── node_modules/                # Dependencies
```

---

## 🎯 Key Directories

### `/docs` - Documentation
All project documentation organized by type:
- **api/** - API endpoint documentation
- **guides/** - How-to guides and tutorials
- **Root docs** - Architecture and summaries

### `/public` - Modular Server
Clean MVC architecture:
- **server.ts** - Main entry point (modular)
- **config/** - Configuration files
- **middleware/** - Express middleware
- **services/** - Business logic layer
- **controllers/** - Request handlers
- **routes/** - Route definitions
- **types/** - TypeScript interfaces

### `/src` - Core Library
WhatsApp bot core functionality:
- **baileys.ts** - Baileys wrapper class
- **utils.ts** - Helper functions

---

## 📊 File Count

- **Total Files:** 24 modular files in `public/`
- **Documentation:** 9 markdown files in `docs/`
- **Average Lines:** ~58 lines per file
- **Main Entry:** 33 lines (server.ts)

---

## 🚀 Quick Navigation

**Getting Started:**
- [README.md](../README.md) - Main documentation
- [docs/guides/PAIRING-CODE.md](docs/guides/PAIRING-CODE.md) - Setup guide

**API Reference:**
- [docs/API-SUMMARY.md](docs/API-SUMMARY.md) - All 52 endpoints
- [docs/api/](docs/api/) - Detailed API docs

**Architecture:**
- [docs/REFACTORING-SUMMARY.md](docs/REFACTORING-SUMMARY.md) - Modular architecture

---

**See [docs/README.md](docs/README.md) for complete documentation.**
