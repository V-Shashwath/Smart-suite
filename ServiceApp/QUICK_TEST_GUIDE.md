# 🧪 Quick Test Guide - Preview & WhatsApp Features

## ⚡ 5-Minute Test Workflow

### Step 1: Scan QR Code (Optional)
```
1. Click 📷 icon next to Customer ID
2. Grant camera permission if asked
3. Scan one of the test QR codes from TEST_QR_CODES.txt
4. Verify customer details populate automatically
```

### Step 2: Add Items
```
1. Click "+ Add Item" button
2. Select a product (e.g., "A4 Xerox - Black & White")
3. Enter quantity (e.g., 100)
4. Click "Add Item"
5. Verify item appears in the list
```

### Step 3: Add Adjustment (Optional)
```
1. Click "+ Add Adjustment" button
2. Select account (e.g., "GST - 18%")
3. Enter Add amount (e.g., 49.50)
4. Click "Add Adjustment"
5. Verify adjustment appears in the list
```

### Step 4: Enter Collections (Optional)
```
1. Scroll to COLLECTIONS section
2. Enter Cash amount (e.g., 300)
3. Enter Card amount (e.g., 0)
4. Enter UPI amount (e.g., 0)
5. Check Balance updates automatically
```

### Step 5: Test Preview
```
1. Scroll to bottom
2. Click "📄 Preview Invoice" button
3. Verify modal opens with all details:
   ✅ Transaction details
   ✅ Customer info
   ✅ Items table
   ✅ Adjustments (if added)
   ✅ Summary calculations
   ✅ Collections & balance
4. Scroll through the preview
5. Click "Close" button
```

### Step 6: Test WhatsApp
```
1. Make sure WhatsApp is installed on your phone
2. Ensure customer has WhatsApp No or Mobile No filled
3. Click "💬 Send WhatsApp" button
4. WhatsApp should open automatically
5. Verify the message is formatted properly:
   ✅ All sections present
   ✅ Items listed correctly
   ✅ Total calculated correctly
   ✅ Customer number pre-filled
6. You can send the message or cancel
```

---

## 🎯 Expected Results

### Preview Modal Should Show:
```
📄 Invoice Preview
├── Transaction Details (ID, Date, Time)
├── Voucher Details (No, Type)
├── Customer Details (ID, Mobile, Type, WhatsApp)
├── Items (2) [Table with Qty, Rate, Amount]
├── Adjustments (1) [If added]
├── Summary (Items, Qty, Gross, Add, Less, Total)
└── Collections (Cash, Card, UPI, Balance)
```

### WhatsApp Message Should Look Like:
```
📄 EMPLOYEE SALES INVOICE
=================================

Transaction Details
ID: TXN-2024-001
Date: 2024-11-15
...

Items (1)
---------------------------------
1. A4 Xerox - Black & White
   Qty: 100 x ₹2.00 = ₹200.00

Summary
---------------------------------
Total Items: 1
Total Bill: ₹200.00

=================================
Thank you for your business! 🙏
```

---

## ⚠️ Validation Tests

### Test 1: Empty Invoice
```
Action: Click "Preview Invoice" or "Send WhatsApp" without adding items
Expected: Alert appears → "No Items - Please add at least one item"
Result: ✅ / ❌
```

### Test 2: No WhatsApp App
```
Action: Click "Send WhatsApp" on device without WhatsApp
Expected: Alert appears → "WhatsApp Not Available"
Result: ✅ / ❌
```

### Test 3: Complex Invoice
```
Action: Add 5+ items, 3 adjustments, collections
Expected: Preview scrolls smoothly, WhatsApp formats correctly
Result: ✅ / ❌
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Preview button does nothing | Add at least one item first |
| WhatsApp doesn't open | Install WhatsApp from Play Store |
| Customer number not pre-filled | Enter Mobile No or WhatsApp No field |
| Preview cuts off content | Scroll within the modal |
| Balance calculation wrong | Check Collections values (only numbers) |

---

## 📊 Test Checklist

- [ ] Camera QR scanning works
- [ ] Customer details populate from QR
- [ ] Can add items successfully
- [ ] Can add adjustments successfully
- [ ] Can delete items with confirmation
- [ ] Can delete adjustments with confirmation
- [ ] Summary calculates correctly
- [ ] Collections update balance
- [ ] Preview button validation works
- [ ] Preview modal displays all sections
- [ ] Preview modal scrolls smoothly
- [ ] Preview close button works
- [ ] WhatsApp button validation works
- [ ] WhatsApp opens correctly
- [ ] WhatsApp message formatted properly
- [ ] Customer number pre-fills in WhatsApp
- [ ] All calculations are accurate
- [ ] UI is responsive on phone
- [ ] No crashes or errors

---

## 🚀 Ready to Test!

1. **Restart your app** (if it's already running):
   ```bash
   # The app should have auto-reloaded
   # If not, shake phone and click "Reload"
   ```

2. **Open the app** in Expo Go

3. **Follow the 6-step workflow above**

4. **Check off the test checklist**

5. **Report any issues** or enjoy your working invoice app! 🎉

---

## 💡 Pro Tips

- **Use Test QR Codes**: Located in `TEST_QR_CODES.txt` in parent folder
- **Generate QR Codes**: Use qr-code-generator.com with test data
- **Test on Physical Device**: WhatsApp integration works best on real phone
- **Try Different Scenarios**: Empty, small, and large invoices
- **Check Calculations**: Verify math is correct for all totals

---

**Happy Testing! 🧪✨**



