# 📚 Documentation

Complete documentation for WhatsApp Bot API.

---

## 📖 Quick Links

### Getting Started
- [Main README](../README.md) - Project overview & setup
- [Pairing Code Guide](guides/PAIRING-CODE.md) - How to use pairing code
- [Testing Guide](guides/TESTING.md) - How to test the bot

### API Documentation
- [API Summary](API-SUMMARY.md) - Complete API overview with examples
- [Connection API](api/CONNECTION-API.md) - Connection management endpoints
- [Media API](api/MEDIA-API.md) - Media sending endpoints
- [Contact API](api/CONTACT-API.md) - Contact management endpoints
- [Webhook API](api/WEBHOOK-API.md) - Webhook system documentation

### Architecture
- [Refactoring Summary](REFACTORING-SUMMARY.md) - Modular architecture details

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)
├── API-SUMMARY.md - Complete API overview
├── REFACTORING-SUMMARY.md - Architecture details
│
├── api/ - API endpoint documentation
│   ├── CONNECTION-API.md
│   ├── MEDIA-API.md
│   ├── CONTACT-API.md
│   └── WEBHOOK-API.md
│
└── guides/ - How-to guides
    ├── PAIRING-CODE.md
    └── TESTING.md
```

---

## 🚀 API Endpoints Overview

**Total: 52 Endpoints**

- **Connection:** 5 endpoints
- **Webhooks:** 5 endpoints
- **Bot Info:** 3 endpoints
- **Messaging:** 10 endpoints
- **Media:** 7 endpoints
- **Contacts:** 8 endpoints
- **Groups:** 14 endpoints

See [API-SUMMARY.md](API-SUMMARY.md) for complete details.

---

## 🏗️ Architecture

The project uses **modular MVC architecture**:

```
Request → Routes → Controllers → Services → Response
                       ↓
                  Middleware
```

See [REFACTORING-SUMMARY.md](REFACTORING-SUMMARY.md) for details.

---

## 📝 Contributing

When adding new features, please update the relevant documentation:

1. Add API endpoint docs to `docs/api/`
2. Add guides to `docs/guides/`
3. Update `API-SUMMARY.md` with new endpoints
4. Update main `README.md` if needed

---

**For more information, see the [main README](../README.md).**
