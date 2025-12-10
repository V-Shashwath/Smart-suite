# Troubleshooting 502/503 Gateway Errors

## Quick Fix Steps

### 1. Check Backend Server Status
```bash
cd backend
npm start
```

You should see:
```
🚀 Backend Server running on port 3000
🌐 Local API: http://localhost:3000/api
```

### 2. Test Backend Locally
Open in browser or use curl:
```bash
curl http://localhost:3000/api
```

Should return: `{"success":true,"message":"Backend API is running"}`

### 3. Check Ngrok Tunnel
```bash
# Check if ngrok is running
# Look for ngrok process or terminal window

# If not running, start it:
ngrok http 3000
```

### 4. Verify Ngrok URL
- Check ngrok terminal for the forwarding URL (e.g., `https://xxxxx.ngrok-free.dev`)
- Update these files with the new URL:
  - `ServiceApp/src/config/api.js` (line 7)
  - `ServiceApp/app.json` (extra.apiBaseUrl)

### 5. Test Ngrok Endpoint
```bash
curl https://your-ngrok-url.ngrok-free.dev/api
```

Should return: `{"success":true,"message":"Backend API is running"}`

## Common Issues

### Issue: Backend not running
**Solution**: Start backend with `npm start` in the `backend` folder

### Issue: Ngrok tunnel expired
**Solution**: Restart ngrok - free tunnels expire after 2 hours

### Issue: Wrong port in ngrok
**Solution**: Ensure ngrok points to `localhost:3000` (not 3001 or other ports)

### Issue: Firewall blocking
**Solution**: Check Windows Firewall allows port 3000

## Verification Checklist
- [ ] Backend server running on port 3000
- [ ] Can access `http://localhost:3000/api` locally
- [ ] Ngrok tunnel active and pointing to `localhost:3000`
- [ ] Ngrok URL matches `ServiceApp/src/config/api.js`
- [ ] Can access ngrok URL from browser/curl
- [ ] No firewall blocking port 3000

