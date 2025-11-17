# 📷 QR Scanner Troubleshooting & Test QR Codes

## 🐛 Common Camera Errors & Solutions

### Error 1: "Camera permission denied"

**Solution**:
1. Close the app
2. Open your phone Settings
3. Go to Apps → Expo Go
4. Tap Permissions
5. Enable Camera permission
6. Restart the app
7. Try scanning again

### Error 2: Camera shows black screen

**Solution**:
1. Grant camera permission (see above)
2. Restart Expo Go app
3. If still black, restart your phone
4. Try again

### Error 3: "Unable to access camera"

**Solution**:
1. Check if another app is using the camera
2. Close all other apps
3. Restart Expo Go
4. Try scanning

### Error 4: App crashes when opening camera

**Solution**:
```powershell
# Stop the app
# Clear cache and restart
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"
expo start -c
```

Then relaunch on your phone.

---

## 🎯 How to Create Test QR Codes

### Method 1: Online QR Generator (Recommended)

**Step 1**: Go to https://www.qr-code-generator.com

**Step 2**: Select "Text" option

**Step 3**: Enter this EXACT text format:
```
CUST-007,9876543210,Premium,9876543210
```

**Format Explanation**:
- Part 1: Customer ID (CUST-007)
- Part 2: Mobile Number (9876543210)
- Part 3: Customer Type (Premium)
- Part 4: WhatsApp Number (9876543210)

**Step 4**: Click "Create QR Code"

**Step 5**: Download or display the QR code

**Step 6**: Scan it with the app!

---

### Method 2: Use Another Website

Try these alternatives:
- https://www.the-qrcode-generator.com
- https://qr.io
- https://goqr.me

All work the same way - just paste the text format above.

---

## 📝 Test QR Code Examples

### Example 1: Premium Customer
```
CUST-007,9876543210,Premium,9876543210
```

**Expected Result**:
- Customer ID: CUST-007
- Mobile No: 9876543210
- Customer Type: Premium
- WhatsApp No: 9876543210

---

### Example 2: Regular Customer
```
CUST-101,8765432109,Regular,8765432109
```

**Expected Result**:
- Customer ID: CUST-101
- Mobile No: 8765432109
- Customer Type: Regular
- WhatsApp No: 8765432109

---

### Example 3: VIP Customer
```
CUST-555,7654321098,VIP,7654321098
```

**Expected Result**:
- Customer ID: CUST-555
- Mobile No: 7654321098
- Customer Type: VIP
- WhatsApp No: 7654321098

---

### Example 4: Corporate Customer
```
BUSI-ABC,+91-9999888877,Corporate,+91-9999888877
```

**Expected Result**:
- Customer ID: BUSI-ABC
- Mobile No: +91-9999888877
- Customer Type: Corporate
- WhatsApp No: +91-9999888877

---

## 🎯 Step-by-Step Testing Guide

### Testing the QR Scanner

**Step 1: Create QR Code**
1. Open https://www.qr-code-generator.com
2. Copy this text: `CUST-007,9876543210,Premium,9876543210`
3. Paste in the text field
4. Generate QR code
5. Display it on your computer screen

**Step 2: Test Camera Permission**
1. Open the app on your phone
2. Scroll to Header section
3. Find "Customer ID" field
4. Tap the 📷 camera icon

**What should happen**:
- Modal opens
- Camera permission request appears (first time only)
- Tap "Allow" or "Grant"
- Camera view appears

**Step 3: Scan the QR Code**
1. Point your phone camera at the QR code on your computer screen
2. Hold steady, about 15-30cm away
3. QR code should scan automatically

**What should happen**:
- "✓ Scanned!" message appears
- Success alert shows
- Modal closes
- Customer ID field updates to "CUST-007"
- Mobile No field updates to "9876543210"
- Customer Type field updates to "Premium"
- WhatsApp No field updates to "9876543210"

---

## 💡 Tips for Better Scanning

### For Best Results:

1. **Good Lighting**: Scan in well-lit area
2. **Clean Screen**: Wipe your computer screen
3. **Hold Steady**: Keep phone still for 2-3 seconds
4. **Distance**: 15-30cm from screen
5. **Full Screen**: Make QR code as large as possible
6. **Brightness**: Increase computer screen brightness

### If Scanning Doesn't Work:

1. **Move Closer/Farther**: Adjust distance
2. **Tilt Phone**: Slight angle might help
3. **Better Light**: Move to brighter area
4. **Regenerate QR**: Make a new one
5. **Print QR**: Print on paper and scan that

---

## 🖨️ Alternative: Print QR Codes

If scanning from screen doesn't work:

1. Generate QR code online
2. Download the image
3. Print on paper
4. Scan the printed QR code

This often works better than scanning from screen!

---

## 🔍 Verify Camera Is Working

**Quick Test**:
1. Open your phone's default Camera app
2. Take a photo
3. If camera works there, it should work in the app
4. If camera doesn't work anywhere, check phone settings

**Check Expo Go Permissions**:
```
Settings → Apps → Expo Go → Permissions → Camera → Allow
```

---

## 📱 Test on Real Device vs Emulator

### Real Device (Recommended):
- ✅ Camera works perfectly
- ✅ Can scan real QR codes
- ✅ Full camera features

### Emulator:
- ⚠️ Camera might not work
- ⚠️ May need virtual camera setup
- ⚠️ Better to test on real device

**For QR scanner, ALWAYS test on real Android phone!**

---

## 🐞 Debug Mode

If you want to see what's happening:

**Check Terminal Output**:
When you tap the camera icon, check your terminal/console for:
- "QR Data received: ..."
- Any error messages

**Check Phone Logs**:
Shake your phone → Developer Menu → Show Logs

---

## ✅ Success Checklist

Before testing QR scanner, ensure:
- [ ] App running on real Android phone (not emulator)
- [ ] Expo Go has camera permission
- [ ] QR code generated with correct format
- [ ] QR code displayed clearly on screen
- [ ] Good lighting in room
- [ ] Camera icon (📷) visible next to Customer ID

---

## 🎯 Expected Behavior

### When Camera Icon Tapped:
```
1. Modal slides up from bottom
2. Camera permission request (first time)
3. User grants permission
4. Camera view appears
5. Instructions show: "Align QR code within frame"
6. Blue corner indicators visible
7. Ready to scan!
```

### When QR Code Scanned:
```
1. Beep or vibration (optional)
2. "✓ Scanned!" message appears
3. Modal closes after 0.5 seconds
4. Alert shows: "QR Code Scanned Successfully! ✓"
5. Customer fields update with scanned data
6. User taps "OK" on alert
```

### What Gets Updated:
```
Customer ID field   → First value from QR
Mobile No field     → Second value from QR
Customer Type field → Third value from QR
WhatsApp No field   → Fourth value from QR
```

---

## 🔄 If Camera Still Not Working

### Last Resort Solutions:

**1. Reinstall Expo Go**:
```
Uninstall Expo Go from phone
Reinstall from Play Store
Grant all permissions
Try again
```

**2. Test with Different QR Code**:
Try simpler data:
```
TEST123
```
Just scan this to see if camera works at all.

**3. Check Expo Version**:
```powershell
expo --version
```
Should be recent version.

**4. Update Dependencies**:
```powershell
cd "C:\Users\user\Desktop\founditup\smart suite\ServiceApp"
npm install
```

**5. Check Camera Package**:
```powershell
npm list expo-camera
```
Should show: expo-camera@17.0.9

---

## 📞 Still Having Issues?

If camera still doesn't work:

1. **Check Error Message**: What exactly does it say?
2. **Check Terminal**: Any errors in console?
3. **Check Phone Model**: Some phones have camera restrictions
4. **Try Another Phone**: Test on different Android device

Common error messages and what they mean:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Permission denied" | No camera access | Grant permission in settings |
| "Camera not available" | Hardware issue | Restart phone |
| "Cannot find camera" | App issue | Reinstall Expo Go |
| Black screen | Permission issue | Check settings |

---

## 🎉 Success!

Once QR scanning works, you should see:

```
✓ Camera opens
✓ QR code scans
✓ Fields populate automatically
✓ Success alert shows
✓ Modal closes

Perfect! 🎉
```

---

## 📝 Quick Reference

**Test QR Code Format**:
```
CustomerID,MobileNo,CustomerType,WhatsAppNo
```

**Example**:
```
CUST-007,9876543210,Premium,9876543210
```

**Generate At**:
https://www.qr-code-generator.com

**Grant Permission**:
Settings → Apps → Expo Go → Permissions → Camera → Allow

**Test On**:
Real Android phone (not emulator)

---

## 💡 Pro Tip

Save multiple QR codes as images on your phone for easy testing:
1. Generate QR codes
2. Download as images
3. Save to phone gallery
4. Use another phone to scan them
5. Or print them on paper

This way you always have test QR codes ready!

---

**Last Updated**: November 15, 2025  
**Status**: 🟢 Camera should work after following these steps



