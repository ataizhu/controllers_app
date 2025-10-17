# Controllers - Subscriber Management System

## 📋 Project Description

Web application for managing municipal enterprise subscribers with multilingual support and Flutter integration for payment processing.

## 🏗️ Architecture

### Main Files:
- **`app.js`** - main application logic (1074 lines)
- **`language.js`** - language system with 3 languages (505 lines)
- **`style.css`** - all application styles (1465 lines)
- **`index.html`** - application interface (139 lines)
- **`cotroller.php`** - universal API handler (472 lines)
- **`createPayments.php`** - QR payment handler (legacy)

## 🌍 Language System

### Supported Languages:
- **🇰🇬 Kyrgyz** (default)
- **🇷🇺 Russian**
- **🇺🇸 English**

### Features:
- **70+ translations** for each language
- **Dynamic switching** without reload
- **Auto-save** selected language
- **Adaptive selectors** with flags and names

## 🔌 API System

### Universal Handler: `cotroller.php`

All requests are processed through one file with command system.

#### Request Format:
```json
{
  "action": "commandName",
  "param1": "value1",
  "param2": "value2"
}
```

#### Available Commands:

**🔐 Authentication:**
- `checkUser` - user verification
- `checkAuth` - authorization check by phoneIdentifier
- `updateAuth` - authorization update
- `addAuth` - new authorization addition
- `logout` - system logout

**🔍 Search:**
- `searchSubscribers` - subscriber search
- `getServices` - services list retrieval

**💳 Payments:**
- `processPayment` - payment creation

## 💰 Payment Logic

### Type Separation:

#### 1. 💵 Cash Payments (`cash`)
- ✅ Creates payment record in database
- ✅ Payment marked as "Completed"
- ✅ Payment type: "Cash"
- ❌ NOT sent to Flutter
- ✅ Shows success message

#### 2. 💳 Terminal Payments (`terminal`)
- ✅ Shows waiting modal
- ✅ Sends data to Flutter via `onPayment`
- ❌ NOT creates payment immediately
- ⏳ Waits for Flutter response
- ✅ Creates payment after confirmation
- ✅ Payment type: "Cashless"

### 🎨 Waiting Modal:
- Shows payment instructions
- Animated spinner
- "Cancel" button
- Blocks interface until response
- Auto-hide keyboard on mobile

## 📱 Flutter Integration

### Handlers:
```dart
// For cash - not used
// For terminal:
onPayment: (data) {
  // Process payment through terminal
  // After success call:
  webViewController.evaluateJavascript(
    'window.createPaymentAfterFlutterConfirmation($paymentDataJson)'
  );
}

onMunicipalLogout: () {
  // Complete municipal enterprise logout
}
```

### Global JavaScript Functions:
- `window.createPaymentAfterFlutterConfirmation(paymentData)` - payment creation after confirmation
- `window.errorWaitingPayment(errorMessage)` - terminal error handling

## 🎨 UI/UX Features

### Responsive Design:
- **Mobile optimization** for all screens
- **Minimalistic** interface
- **Icons** instead of text for buttons
- **Compact pagination**

### Modal Windows:
- **Custom** instead of native alert/confirm
- **Auto-hide** keyboard
- **Beautiful animations** and shadows
- **Adaptive** sizes

### Language Selector:
- **Flags only** in closed state
- **Flag + name** when opened
- **Tooltip** with language names

## 🔧 Technical Features

### Development Principles:
- ✅ **Modularity** - languages, styles, API separated
- ✅ **JSON API** - all requests in JSON format
- ✅ **Separation of concerns** - each button has its own logic
- ✅ **Security** - fallback translations, error handling
- ✅ **Clean code** - styles in CSS, logic in JS

### Optimizations:
- **Universal modal system** (67% code reduction)
- **Centralized translations** in one file
- **Minimal code duplication**
- **Efficient event handling**

## 📊 Project Statistics

- **Total code volume:** ~3700 lines
- **Supported languages:** 3
- **Number of translations:** 70+ per language
- **API commands:** 8
- **Payment types:** 2
- **Application screens:** 3

## 🚀 Getting Started

1. **Setup:** Place files on web server
2. **Configuration:** Copy `config.example.js` to `config.js` and configure URL
3. **Database:** Configure Vtiger connection in `cotroller.php`
4. **Flutter:** Implement payment handlers
5. **Languages:** All translations included
6. **Ready:** Application ready for production use

## ⚙️ Configuration

### `config.js` file:
```javascript
const CONFIG = {
    BASE_API_URL: "https://your-domain.com/controllers/cotroller.php",
    // Or for local development:
    // BASE_API_URL: "./cotroller.php",
    CHECK_PASS_URL: "../checkPass.php",
    ITEMS_PER_PAGE: 10
};
```

**⚠️ Important:** `config.js` file is excluded from Git for security. Use `config.example.js` as template.

## 📝 License

This project is proprietary software for municipal enterprise management.

## 🔧 Installation

### Requirements:
- Web server (Apache/Nginx)
- PHP 7.4+
- Vtiger CRM database
- Flutter mobile app

### Setup Steps:
1. Upload files to web server
2. Configure database connection in `cotroller.php`
3. Set up Flutter handlers
4. Test payment flows
5. Deploy to production

## 🐛 Troubleshooting

### Common Issues:
- **Language not switching:** Check `language.js` loading
- **Payments not working:** Verify Flutter integration
- **API errors:** Check `cotroller.php` configuration
- **Mobile issues:** Test responsive design

### Support:
For technical support, contact the development team.
