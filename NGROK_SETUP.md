# ngrok Setup Guide - For Different Networks

## Why ngrok for Different Networks?

When users are on **different networks**, you need a public URL that works from anywhere on the internet. ngrok creates this instantly.

✅ **Works from any network** - User 1 and User 2 can both access  
✅ **No router configuration** - Works behind any firewall  
✅ **HTTPS by default** - Secure connection  
✅ **Free tier available** - Perfect for development  

---

## Step-by-Step Setup

### Step 1: Download ngrok
1. Go to: https://ngrok.com/download
2. Download Windows version
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)

### Step 2: Sign Up (Free)
1. Go to: https://dashboard.ngrok.com/signup
2. Create free account (email + password)
3. Verify your email

### Step 3: Get Your Authtoken
1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6rst789uvw012xyz345`)

### Step 4: Configure ngrok
Open PowerShell and run:
```powershell
# Navigate to ngrok folder
cd C:\ngrok

# Set your authtoken (replace YOUR_AUTHTOKEN with the one you copied)
.\ngrok.exe config add-authtoken YOUR_AUTHTOKEN
```

You should see: `Authtoken saved to configuration file`

### Step 5: Start ngrok Tunnel
```powershell
# Make sure backend is running first (port 3000)
# Then in ngrok folder, run:
.\ngrok.exe http 3000
```

You'll see output like:
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy the Forwarding URL:** `https://abc123.ngrok-free.app`

### Step 6: Update API Configuration

**Update `ServiceApp/src/config/api.js`:**
```javascript
// Backend API URL (backend runs on port 3000, database on port 59320)
// Using ngrok for tunnel/remote access (works from different networks)
let API_BASE_URL = 'https://YOUR_NGROK_URL.ngrok-free.app/api';
```

**Update `ServiceApp/app.json`:**
```json
"extra": {
  "apiBaseUrl": "https://YOUR_NGROK_URL.ngrok-free.app/api"
}
```

Replace `YOUR_NGROK_URL` with your actual ngrok URL (e.g., `abc123.ngrok-free.app`)

### Step 7: Restart Expo
```bash
cd ServiceApp
npx expo start --tunnel --clear
```

---

## Important Notes

### ⚠️ ngrok URL Changes
- **Free tier:** URL changes every time you restart ngrok
- **Paid tier:** Can get static domain (optional)
- **Solution:** Update config files when URL changes, or use paid tier for static URL

### ⚠️ ngrok Browser Warning (Free Tier)
- ngrok free tier shows a "Visit Site" warning page on first request
- **For mobile apps:** Add this header to bypass the warning:
  ```javascript
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
  ```
- This is already handled in the API config, but if you see HTML instead of JSON, visit the URL in a browser first

### 🔄 Keeping ngrok Running
- Keep the ngrok terminal window open
- If you close it, the URL stops working
- Restart ngrok if backend server restarts

### 🌐 Testing
1. Test from your computer:
   ```powershell
   curl https://YOUR_NGROK_URL.ngrok-free.app/
   ```
   Should return: `{"success":true,"message":"Backend API is running"}`

2. Test from mobile app:
   - Start Expo with tunnel
   - App should connect to ngrok URL
   - Check console logs for API calls

---

## Troubleshooting

### ngrok URL not working?
1. Make sure backend is running on port 3000
2. Make sure ngrok is running (`ngrok http 3000`)
3. Check ngrok web interface: http://127.0.0.1:4040
4. Verify the URL in config files matches ngrok output

### Still getting network errors?
1. Clear Expo cache: `npx expo start --tunnel --clear`
2. Check console logs for actual API URL being used
3. Verify ngrok is forwarding correctly (check web interface)

---

## Quick Reference

**Start ngrok:**
```powershell
cd C:\ngrok
.\ngrok.exe http 3000
```

**Update config when URL changes:**
- `ServiceApp/src/config/api.js`
- `ServiceApp/app.json`

**Test connection:**
```powershell
curl https://YOUR_NGROK_URL.ngrok-free.app/
```

---

**This solution works perfectly for users on different networks!** 🎯

