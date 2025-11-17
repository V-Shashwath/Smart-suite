# ⚡ ServiceApp - Quick Commands Reference

Fast access to all common commands for developing ServiceApp.

## 🚀 Start the App (Pick One)

```powershell
# Navigate to project first
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"

# Option 1: Interactive (recommended) - Then press 'a' for Android
npm start

# Option 2: Direct Android launch
npm run android

# Option 3: Direct iOS launch (macOS only)
npm run ios

# Option 4: Web preview
npm run web
```

## 🔧 Development Commands

```powershell
# Clear cache and restart
expo start -c

# Reinstall dependencies
npm install

# Check installed packages
npm list --depth=0

# Check versions
node --version
npm --version
expo --version
```

## 📝 Editing & Reloading

| Action | Keys |
|--------|------|
| Reload app | Press `r` in terminal |
| Open Android emulator | Press `a` |
| Open iOS simulator | Press `i` |
| Open web preview | Press `w` |
| Show menu | Press `m` |
| Exit | Press `Ctrl+C` |

## 🌳 Project Navigation

```powershell
# Go to project directory
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"

# View project structure
dir
dir src

# View file content (examples)
type src\screens\InvoiceScreen.js
type App.js
type package.json
```

## 💾 Git Commands

```powershell
# Check status
git status

# View commit history
git log --oneline

# View recent commits (5 most recent)
git log --oneline -n 5

# Add changes
git add .

# Commit changes
git commit -m "your message here"

# View diff
git diff
```

## 📁 File Locations

| File/Folder | Purpose | Path |
|------------|---------|------|
| Main Invoice Screen | UI Component | `src/screens/InvoiceScreen.js` |
| App Root | Entry Component | `App.js` |
| Config | Expo Config | `app.json` |
| Dependencies | Package List | `package.json` |
| Components | Reusable UI | `src/components/` |
| Constants | App Constants | `src/constants/` |
| Data | Mock Data | `src/data/` |

## 🐛 Troubleshooting

```powershell
# Port already in use
npm start -- --port 19001

# Module not found
npm install

# Cache issues
expo start -c

# Expo CLI not found
npm install -g expo-cli

# Device issues - run native commands
npm run android
npm run ios
npm run web
```

## 📱 Scanning QR Code

1. **Android Device**: Open Expo Go app and tap scan
2. **iPhone**: Use camera app, tap notification that appears
3. **Same WiFi**: Ensure phone and computer are on same network
4. **Manual Entry**: Copy URL from terminal into Expo Go if QR doesn't work

## 💡 Pro Tips

```powershell
# Monitor file changes (auto-reload enabled by default)
# Just save files in your editor!

# View console logs in terminal while app runs
# Use console.log() in your code

# Fast refresh - press 'r' in terminal for quick reload

# Debug mode - long press on Android or shake device
```

## 🎨 Customization Quick Tips

**Edit Invoice Data:**
- File: `src/screens/InvoiceScreen.js`
- Look for: `const invoiceData = {`
- Modify: invoiceData properties

**Change Colors:**
- File: `src/screens/InvoiceScreen.js`
- Look for: `const styles = StyleSheet.create({`
- Modify: HEX color values

**Add New Sections:**
- File: `src/screens/InvoiceScreen.js`
- Create: `const renderNewSection = () => {}`
- Add to tab rendering

## 📚 Documentation Files

- **README.md** - Complete documentation
- **GETTING_STARTED.md** - First-time setup
- **SETUP_SUMMARY.md** - Phase 0 completion
- **QUICK_COMMANDS.md** - This file

## 🔗 Important Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Expo Go Download](https://expo.dev/download)
- [Android Studio](https://developer.android.com/studio)

## ✅ Verification Checklist

```powershell
# Run these to verify setup
node --version       # Should show v18+
npm --version        # Should show v9+
expo --version       # Should show version number
npm list --depth=0   # Should show 4 main dependencies
git log --oneline    # Should show commits
```

## 📊 Project Info

- **Project Name**: ServiceApp
- **Framework**: React Native
- **CLI**: Expo
- **Version**: 1.0.0
- **Node Requirement**: v18+
- **npm Requirement**: v9+

## 🎯 Typical Workflow

```powershell
# 1. Navigate to project
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"

# 2. Start development
npm start

# 3. Press 'a' for Android (or scan QR code)

# 4. Make code changes (auto-reload enabled)
# Edit src/screens/InvoiceScreen.js

# 5. Press 'r' in terminal to reload if needed

# 6. When done, Ctrl+C to stop server

# 7. Commit changes
git add .
git commit -m "feat: description of changes"
```

---

**Last Updated**: November 15, 2025  
**Status**: ✅ Ready to Use




