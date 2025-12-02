# 🔐 Environment Variables Quick Setup

## ✅ What's Been Set Up

1. **Backend `.gitignore`** - Updated to exclude `.env` files
2. **Frontend `.gitignore`** - Updated to exclude `.env` files  
3. **Root `.gitignore`** - Created for project-wide ignores
4. **Backend uses `dotenv`** - Database config now reads from `.env`
5. **Frontend uses `app.json`** - API URL configured in `expo.extra.apiBaseUrl`

## 🚀 Quick Start

### Backend

1. **Create `.env` file:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```env
   DB_SERVER=103.98.12.218
   DB_PORT=59320
   DB_NAME=mobileApp
   DB_USER=Ikonuser
   DB_PASSWORD=userikon
   ```

3. **Start server:**
   ```bash
   npm start
   ```

### Frontend

1. **Update `app.json`:**
   ```json
   "extra": {
     "apiBaseUrl": "http://YOUR_COMPUTER_IP:3000/api"
   }
   ```

2. **Or update `ServiceApp/src/config/api.js` directly:**
   ```javascript
   let API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
   ```

3. **Restart Expo:**
   ```bash
   npm start
   ```

## 📝 Files Created/Updated

- ✅ `backend/.gitignore` - Enhanced with more ignore patterns
- ✅ `ServiceApp/.gitignore` - Added `.env` files
- ✅ `.gitignore` (root) - Project-wide ignores
- ✅ `backend/.env.example` - Template for backend env vars
- ✅ `ServiceApp/.env.example` - Template for frontend env vars
- ✅ `backend/src/config/database.js` - Now uses `process.env`
- ✅ `backend/src/server.js` - Loads `dotenv` on startup
- ✅ `ServiceApp/src/config/api.js` - Reads from `app.json` or uses fallback
- ✅ `ServiceApp/app.json` - Added `extra.apiBaseUrl` config

## 🔒 Security

- ✅ `.env` files are in `.gitignore` (won't be committed)
- ✅ `.env.example` files show what's needed (safe to commit)
- ✅ Sensitive data (passwords, IPs) stored in `.env` only

## 📖 Full Documentation

See `ENV_SETUP.md` for detailed setup instructions and troubleshooting.

