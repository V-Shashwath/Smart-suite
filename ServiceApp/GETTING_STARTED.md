# 🚀 Getting Started with ServiceApp

Welcome! This guide will help you run the Employee Sales Invoice app on your Android device or emulator.

## ⚡ Quick Start (60 seconds)

### Step 1: Navigate to Project
```powershell
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"
```

### Step 2: Start the App
```powershell
npm start
```

You should see:
```
Starting Expo CLI...
Expo DevTools is running at...
```

### Step 3: Open on Android

**Option A: Using Android Emulator**
1. Have Android Studio open with an emulator running
2. In the terminal, press `a`
3. Wait for the app to load (30-60 seconds)

**Option B: Using Physical Device with Expo Go**
1. Download "Expo Go" app from Google Play Store
2. In the terminal, scan the QR code with your device camera or Expo Go app
3. App will open automatically on your phone

**Option C: Direct Command**
```powershell
npm run android
```

## 🎯 What You'll See

When the app loads, you'll see the **Employee Sales Invoice** screen with:

- **Header**: "Employee Sales Invoice" title
- **Three Tabs**: Details | Items | Summary
- **Details Tab** (default):
  - Transaction details (ID, Date, Status)
  - Header info with invoice number
  - Voucher section showing discount code
  - Customer & Employee information cards
  
- **Items Tab**:
  - Table of line items with quantities and prices
  - Adjustments (discounts, taxes, shipping)
  - Payment collections with status
  
- **Summary Tab**:
  - Financial summary with totals
  - Payment collection details

## 📱 Interacting with the App

### Tab Navigation
- Tap the **Details**, **Items**, or **Summary** tabs at the top to switch between sections

### Scrolling
- Scroll up and down to see all content in each tab

### Viewing Data
- All data is mocked (sample data) for demonstration
- No network calls are made

## 🔧 Troubleshooting

### Issue: "expo: command not found"
**Solution:**
```powershell
npm install -g expo-cli
```

### Issue: App won't start
**Solution 1:** Clear cache
```powershell
expo start -c
```

**Solution 2:** Reinstall dependencies
```powershell
npm install
```

### Issue: Android Emulator not available
**Solution:**
1. Install Android Studio from https://developer.android.com/studio
2. Create a virtual device
3. Start the emulator
4. Run `npm start` and press `a`

### Issue: "Port 19000 already in use"
**Solution:**
```powershell
npm start -- --port 19001
```

### Issue: Can't scan QR code
**Solution:**
1. Make sure you have Expo Go app installed
2. Ensure phone is on same WiFi as computer
3. Check that terminal shows a valid QR code
4. Try entering the connection URL manually in Expo Go

## 💡 Pro Tips

### Auto-reload
The app auto-reloads when you save files. Edit `src/screens/InvoiceScreen.js` and see changes instantly!

### View Logs
All console logs appear in the terminal. Use:
```javascript
console.log('Debug message');
```

### Fast Refresh
Press `r` in terminal to reload, `a` for Android, `i` for iOS, `w` for web.

## 📋 File Locations

Your main files are:

```
ServiceApp/
├── src/screens/InvoiceScreen.js    ← Main invoice component (edit here!)
├── App.js                          ← Root component
├── package.json                    ← Dependencies
└── app.json                        ← Expo configuration
```

## 🎨 Customizing the App

### Change Invoice Data
Open `src/screens/InvoiceScreen.js` and find:
```javascript
const invoiceData = {
  transactionId: 'TXN-2025-001234',
  // ... edit this section
}
```

### Change Colors
Search for HEX colors in the `styles` at the bottom of `InvoiceScreen.js`:
```javascript
backgroundColor: '#2196F3',  // Change this to any color
```

### Modify Content
Edit the render functions like `renderTransactionDetails()`, `renderItemBody()`, etc.

## 📚 Next Steps

1. ✅ Get the app running
2. 📝 Explore the code in `src/screens/InvoiceScreen.js`
3. 🎨 Try customizing colors and data
4. 🔄 Follow the "Phase 1" instructions when ready for next features

## 🆘 Need Help?

1. Check the full [README.md](./README.md) for detailed documentation
2. Visit [Expo Docs](https://docs.expo.dev)
3. Check [React Native Docs](https://reactnative.dev)
4. Ensure Node.js is updated: `node --version` (should be v18+)

## ✅ Verification Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm v9+ installed (`npm --version`)
- [ ] Expo CLI installed (`expo --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] App starts without errors (`npm start`)
- [ ] Can see invoice screen on device/emulator
- [ ] Can tap between tabs
- [ ] Can scroll through content

---

🎉 **You're all set! Happy coding!**

Last Updated: November 15, 2025



