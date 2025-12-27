# Contact Management API Documentation

## Overview

API endpoints untuk manage contacts, block/unblock, dan update bot profile.

---

## 📡 Contact Endpoints

### 1. Get All Contacts

**GET** `/contacts`

Dapatkan semua kontak yang tersimpan di bot.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "628xxx@s.whatsapp.net",
      "name": "John Doe",
      "notify": "John",
      "verifiedName": "John Doe Business"
    }
  ],
  "count": 150
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/contacts \
  -H "x-api-key: YOUR_API_KEY"
```

---

### 2. Get Contact Info

**GET** `/contacts/:jid`

Dapatkan informasi detail kontak berdasarkan JID.

**Parameters:**
- `jid` - WhatsApp JID (e.g., `628xxx@s.whatsapp.net`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "628xxx@s.whatsapp.net",
    "name": "John Doe",
    "notify": "John",
    "verifiedName": "John Doe Business"
  }
}
```

---

### 3. Block Contact

**POST** `/contacts/block`

Block kontak tertentu.

**Request Body:**
```json
{
  "jid": "628xxx@s.whatsapp.net"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact blocked successfully"
}
```

---

### 4. Unblock Contact

**POST** `/contacts/unblock`

Unblock kontak yang sudah diblock.

**Request Body:**
```json
{
  "jid": "628xxx@s.whatsapp.net"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact unblocked successfully"
}
```

---

### 5. Get Blocked Contacts

**GET** `/contacts/blocked`

Dapatkan list semua kontak yang diblock.

**Response:**
```json
{
  "success": true,
  "data": [
    "628xxx@s.whatsapp.net",
    "628yyy@s.whatsapp.net"
  ],
  "count": 2
}
```

---

### 6. Get Profile Picture

**GET** `/contacts/:jid/picture`

Dapatkan URL profile picture kontak.

**Parameters:**
- `jid` - WhatsApp JID

**Response:**
```json
{
  "success": true,
  "data": {
    "pictureUrl": "https://pps.whatsapp.net/..."
  }
}
```

---

## 🤖 Bot Profile Endpoints

### 7. Update Bot Profile Name

**POST** `/bot/profile/name`

Update nama profile bot.

**Request Body:**
```json
{
  "name": "My Business Bot"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile name updated successfully"
}
```

---

### 8. Update Bot Profile Status

**POST** `/bot/profile/status`

Update status/bio bot.

**Request Body:**
```json
{
  "status": "Available 24/7 for customer support"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile status updated successfully"
}
```

---

## 🎨 Frontend Integration Examples

### React Example

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const API_KEY = 'your_api_key_here';

// Contact Management Service
class ContactService {
  // Get all contacts
  async getAllContacts() {
    const { data } = await axios.get(`${API_URL}/contacts`, {
      headers: { 'x-api-key': API_KEY }
    });
    return data.data;
  }
  
  // Get contact info
  async getContact(jid) {
    const { data } = await axios.get(`${API_URL}/contacts/${jid}`, {
      headers: { 'x-api-key': API_KEY }
    });
    return data.data;
  }
  
  // Block contact
  async blockContact(jid) {
    await axios.post(`${API_URL}/contacts/block`, 
      { jid },
      { headers: { 'x-api-key': API_KEY } }
    );
  }
  
  // Unblock contact
  async unblockContact(jid) {
    await axios.post(`${API_URL}/contacts/unblock`, 
      { jid },
      { headers: { 'x-api-key': API_KEY } }
    );
  }
  
  // Get blocked list
  async getBlockedContacts() {
    const { data } = await axios.get(`${API_URL}/contacts/blocked`, {
      headers: { 'x-api-key': API_KEY }
    });
    return data.data;
  }
  
  // Get profile picture
  async getProfilePicture(jid) {
    const { data } = await axios.get(`${API_URL}/contacts/${jid}/picture`, {
      headers: { 'x-api-key': API_KEY }
    });
    return data.data.pictureUrl;
  }
}

// Usage
const contactService = new ContactService();

// Get all contacts
const contacts = await contactService.getAllContacts();
console.log('Total contacts:', contacts.length);

// Block a contact
await contactService.blockContact('628xxx@s.whatsapp.net');
```

---

### Vue.js Example

```javascript
export default {
  data() {
    return {
      contacts: [],
      blockedContacts: [],
      selectedContact: null
    }
  },
  
  async mounted() {
    await this.loadContacts();
  },
  
  methods: {
    async loadContacts() {
      try {
        const { data } = await this.$axios.get('/contacts', {
          headers: { 'x-api-key': process.env.VUE_APP_API_KEY }
        });
        this.contacts = data.data;
      } catch (error) {
        this.$toast.error('Failed to load contacts');
      }
    },
    
    async blockContact(jid) {
      try {
        await this.$axios.post('/contacts/block', 
          { jid },
          { headers: { 'x-api-key': process.env.VUE_APP_API_KEY } }
        );
        this.$toast.success('Contact blocked');
        await this.loadContacts();
      } catch (error) {
        this.$toast.error('Failed to block contact');
      }
    },
    
    async updateBotProfile() {
      await this.$axios.post('/bot/profile/name', 
        { name: 'My New Bot Name' },
        { headers: { 'x-api-key': process.env.VUE_APP_API_KEY } }
      );
    }
  }
}
```

---

### React Native Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image } from 'react-native';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [blockedList, setBlockedList] = useState([]);
  
  useEffect(() => {
    loadContacts();
    loadBlockedList();
  }, []);
  
  const loadContacts = async () => {
    const response = await fetch('http://yourserver.com/contacts', {
      headers: { 'x-api-key': 'YOUR_API_KEY' }
    });
    const data = await response.json();
    setContacts(data.data);
  };
  
  const loadBlockedList = async () => {
    const response = await fetch('http://yourserver.com/contacts/blocked', {
      headers: { 'x-api-key': 'YOUR_API_KEY' }
    });
    const data = await response.json();
    setBlockedList(data.data);
  };
  
  const blockContact = async (jid) => {
    await fetch('http://yourserver.com/contacts/block', {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jid })
    });
    
    await loadContacts();
    await loadBlockedList();
  };
  
  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <Image 
        source={{ uri: item.pictureUrl }} 
        style={styles.avatar}
      />
      <Text>{item.name || item.id}</Text>
      <TouchableOpacity onPress={() => blockContact(item.id)}>
        <Text style={styles.blockButton}>Block</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <FlatList
      data={contacts}
      renderItem={renderContact}
      keyExtractor={item => item.id}
    />
  );
};
```

---

## 💡 Use Cases

### 1. Contact Management Dashboard
```javascript
// Display all contacts with search and filter
const ContactDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <input 
        placeholder="Search contacts..."
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ContactList contacts={filteredContacts} />
    </div>
  );
};
```

### 2. Block Management
```javascript
// Manage blocked contacts
const BlockedContactsManager = () => {
  const [blocked, setBlocked] = useState([]);
  
  const unblockAll = async () => {
    for (const jid of blocked) {
      await contactService.unblockContact(jid);
    }
    await loadBlockedList();
  };
  
  return (
    <div>
      <h2>Blocked Contacts ({blocked.length})</h2>
      <button onClick={unblockAll}>Unblock All</button>
      <BlockedList contacts={blocked} />
    </div>
  );
};
```

### 3. Profile Picture Gallery
```javascript
// Display contact profile pictures
const ContactGallery = ({ contacts }) => {
  const [pictures, setPictures] = useState({});
  
  useEffect(() => {
    contacts.forEach(async (contact) => {
      const url = await contactService.getProfilePicture(contact.id);
      setPictures(prev => ({ ...prev, [contact.id]: url }));
    });
  }, [contacts]);
  
  return (
    <div className="gallery">
      {contacts.map(contact => (
        <img 
          key={contact.id}
          src={pictures[contact.id] || '/default-avatar.png'}
          alt={contact.name}
        />
      ))}
    </div>
  );
};
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing jid) |
| 403 | Forbidden (invalid API key) |
| 404 | Contact not found |
| 500 | Server Error |

---

## 💡 Tips & Best Practices

1. **Cache Contact List** - Store locally to reduce API calls
2. **Sync Periodically** - Refresh contact list every 5-10 minutes
3. **Handle Errors** - Always implement error handling
4. **Profile Pictures** - Cache URLs to avoid repeated requests
5. **Blocked List** - Show blocked status in UI

---

**Happy Coding! 🚀**
