# Environment Variables Setup Guide

## 📋 Overview

This project uses environment variables to store sensitive configuration like database credentials and API URLs. This keeps sensitive data out of version control.

## 🔧 Backend Setup

### Step 1: Create `.env` file

In the `backend` folder, create a `.env` file:

```bash
cd backend
copy .env.example .env
```

Or manually create `backend/.env`:

```env
# Backend Environment Variables

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_SERVER=103.98.12.218
DB_PORT=59320
DB_NAME=mobileApp
DB_USER=Ikonuser
DB_PASSWORD=userikon
DB_ENCRYPT=false

# API Configuration
API_BASE_URL=http://localhost:3000/api
```

### Step 2: Update values

Edit `backend/.env` with your actual database credentials and configuration.

### Step 3: Verify

The backend will automatically load `.env` when it starts. No additional setup needed!

## 📱 Frontend Setup (React Native/Expo)

### Option 1: Using app.json (Recommended for Expo)

1. **Update `ServiceApp/app.json`:**

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://YOUR_COMPUTER_IP:3000/api"
    }
  }
}
```

2. **Update `ServiceApp/src/config/api.js`:**

```javascript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.1.100:3000/api';
```

### Option 2: Using .env file (Alternative)

1. **Install babel plugin:**

```bash
cd ServiceApp
npm install --save-dev babel-plugin-dotenv-import
```

2. **Update `ServiceApp/babel.config.js`:**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }]
    ],
  };
};
```

3. **Create `ServiceApp/.env`:**

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:3000/api
```

4. **Update `ServiceApp/src/config/api.js`:**

```javascript
import { EXPO_PUBLIC_API_BASE_URL } from '@env';

const API_BASE_URL = EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.100:3000/api';
```

### Option 3: Simple Config File (Current Implementation)

The current implementation uses a simple config file. Just update `ServiceApp/src/config/api.js` directly:

```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

## 🔒 Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Always commit `.env.example`** - This shows what variables are needed
3. **Use different values for development/production**
4. **Rotate credentials regularly**

## 📝 Finding Your Computer's IP

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

## ✅ Verification

### Backend:
```bash
cd backend
npm start
```
Should connect to database using credentials from `.env`

### Frontend:
1. Update API_BASE_URL with your computer's IP
2. Start Expo: `npm start`
3. Test API calls - they should connect to your backend

## 🚨 Troubleshooting

### Backend can't read .env
- Make sure `.env` is in the `backend` folder (same level as `package.json`)
- Check that `dotenv` is installed: `npm list dotenv`
- Restart the server after creating/editing `.env`

### Frontend can't connect to backend
- Verify `API_BASE_URL` has your computer's IP (not `localhost` or `127.0.0.1`)
- Ensure backend server is running
- Check firewall allows port 3000
- Verify phone and computer are on same Wi-Fi network

---

**Important:** After setting up environment variables, restart both backend and frontend servers!

