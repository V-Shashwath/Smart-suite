# ServiceApp - Employee Sales Invoice

A modern React Native mobile application for managing and displaying employee sales invoices, built with Expo Go for seamless Android and iOS development.

## 📋 Project Overview

**ServiceApp** is a visually accurate, fully functional Employee Sales Invoice screen designed for Android mobile application. The application features:

- ✅ Transaction Details display
- ✅ Voucher information section
- ✅ Header with invoice details
- ✅ Customer and Employee information
- ✅ Itemized product/service listing
- ✅ Adjustments (discounts, taxes, shipping)
- ✅ Summary with total calculations
- ✅ Collections tracking with payment status
- ✅ Tab-based navigation for organized content
- ✅ Responsive design for various screen sizes
- ✅ Mocked data for rapid prototyping

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Expo CLI** (installed globally)
- **Android Studio** (for Android emulator) or **Expo Go** app on physical device

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Verify Environment**

   ```bash
   node --version    # Check Node.js
   npm --version     # Check npm
   expo --version    # Check Expo CLI
   ```

### Running the Application

#### Option 1: Using Expo CLI (Recommended)

```bash
npm start
```

This will open the Expo Developer Tools in your terminal. Then:

- **For Android Emulator**: Press `a`
- **For Physical Device**: Scan the QR code with Expo Go app
- **For Web Preview**: Press `w`

#### Option 2: Direct Android Launch

```bash
npm run android
```

#### Option 3: Direct iOS Launch (macOS only)

```bash
npm run ios
```

#### Option 4: Web Preview

```bash
npm run web
```

### Using Expo Go on Physical Device

1. Download **Expo Go** from Google Play Store (Android) or App Store (iOS)
2. Run `npm start`
3. Scan the QR code displayed in terminal with your device camera or Expo Go app
4. The app will load on your device

## 📁 Project Structure

```
ServiceApp/
├── src/
│   ├── screens/
│   │   └── InvoiceScreen.js      # Main invoice display component
│   ├── components/                # Reusable UI components (to be created)
│   ├── constants/                 # App constants and configurations
│   └── data/                      # Mock data and sample files
├── App.js                         # Root component
├── app.json                       # Expo configuration
├── index.js                       # Entry point
├── package.json                   # Project dependencies
└── README.md                      # This file
```

## 🎨 Components

### InvoiceScreen

**Location**: `src/screens/InvoiceScreen.js`

The main screen component displaying the Employee Sales Invoice with the following sections:

#### Transaction Details Section
- Transaction ID
- Date
- Status badge

#### Header Section
- Invoice number
- Transaction date

#### Voucher Section
- Voucher code
- Discount amount
- Expiry date

#### Customer & Employee Info
- Employee name, position, and ID
- Customer name, email, and phone

#### Items Section
- Itemized table with:
  - Description
  - Quantity
  - Unit Price
  - Amount

#### Adjustments Section
- Discount entries
- Tax calculations
- Shipping charges

#### Summary Section
- Subtotal calculation
- Adjustments summary
- Total amount due

#### Collections Section
- Payment methods used
- Payment dates
- Amount per payment
- Payment status (Completed/Pending)

### Tab Navigation

Three main tabs organize content:

1. **Details Tab**: Transaction details, header, voucher, and customer/employee info
2. **Items Tab**: Itemized products/services, adjustments, and collections
3. **Summary Tab**: Financial summary and payment collections

## 🎯 Features

### Current Implementation

- ✅ Mock data for 3 line items
- ✅ Multiple payment methods (Credit Card, Bank Transfer)
- ✅ Dynamic color-coded status indicators
- ✅ Responsive table layout for items
- ✅ Professional styling with Material Design principles
- ✅ Smooth tab navigation
- ✅ Scrollable content for mobile devices
- ✅ Currency formatting (₹ Indian Rupee)

### Styling Highlights

- Clean, modern interface with soft shadows
- Color-coded sections (blue headers, green success, red alerts)
- Responsive padding and margins for all screen sizes
- Professional typography hierarchy
- Easy-to-read data tables

## 💾 Mock Data

The application uses mocked data for rapid prototyping. Data includes:

- Single invoice with complete details
- Multiple line items with descriptions and amounts
- Adjustments (discounts, taxes)
- Collections with different payment methods and statuses
- Voucher information

### Sample Mock Data Structure

```javascript
invoiceData = {
  transactionId: 'TXN-2025-001234',
  date: '15 Nov 2025',
  status: 'Completed',
  employee: { ... },
  customer: { ... },
  items: [ ... ],
  adjustments: [ ... ],
  summary: { ... },
  collections: [ ... ],
  voucher: { ... }
}
```

## 🔧 Customization

### Modifying Mock Data

Edit the `invoiceData` object in `src/screens/InvoiceScreen.js` to:
- Change invoice details
- Add/remove line items
- Modify customer or employee information
- Adjust payment collections

### Styling Customization

All styles are defined in the `StyleSheet` at the end of `InvoiceScreen.js`. Customize:

- Colors: Update HEX values in color properties
- Fonts: Modify `fontSize` and `fontWeight` values
- Spacing: Adjust `padding` and `margin` values
- Layout: Modify `flex`, `flexDirection`, and alignment properties

### Adding New Sections

To add new sections to the invoice:

1. Create a render function:
   ```javascript
   const renderNewSection = () => (
     <View style={styles.section}>
       {/* Content here */}
     </View>
   );
   ```

2. Add to appropriate tab:
   ```javascript
   {activeTab === 'details' && (
     <>
       {renderTransactionDetails()}
       {renderNewSection()}
     </>
   )}
   ```

## 📱 Device Compatibility

- **Android**: 5.0 and above
- **iOS**: 13.0 and above
- **Web**: All modern browsers

## 🐛 Troubleshooting

### "expo: command not found"

```bash
npm install -g expo-cli
```

### "Cannot find module" errors

```bash
npm install
```

### Android Emulator not starting

1. Ensure Android Studio is installed
2. Create a virtual device in Android Studio
3. Start the emulator before running the app
4. Try: `npm run android`

### Port 19000 already in use

```bash
npm start -- --port 19001
```

### Metro Bundler issues

Clear cache and restart:

```bash
expo start -c
```

## 📝 Development Notes

### Best Practices Implemented

✅ Component-based architecture
✅ Separate concerns (screens, components, data)
✅ Responsive design patterns
✅ Consistent styling approach
✅ Clear code organization
✅ Accessibility considerations (proper contrast, readable text sizes)

### Next Steps for Enhancement

- [ ] Integrate with backend API for real data
- [ ] Add filtering and search functionality
- [ ] Implement PDF export feature
- [ ] Add email/share functionality
- [ ] Integrate payment gateway
- [ ] Add offline data persistence (AsyncStorage)
- [ ] Implement real authentication
- [ ] Add push notifications
- [ ] Create settings screen
- [ ] Add dark mode support

## 🔐 Security Notes

This is a prototype with mocked data. For production:

- Secure API endpoints with HTTPS
- Implement proper authentication/authorization
- Encrypt sensitive data (payment info, customer details)
- Validate all user inputs
- Use environment variables for API keys
- Implement proper error handling and logging

## 📄 License

This project is provided as-is for development and demonstration purposes.

## 👨‍💻 Author

Created as part of the ServiceApp React Native development initiative.

## 📞 Support

For issues or questions, refer to:

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Go Guide](https://docs.expo.dev/get-started/expo-go/)

---

**Happy Coding! 🚀**

Last Updated: November 15, 2025
Version: 1.0.0




