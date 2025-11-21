# 💰 Budget Manager

A modern, lightweight budget tracking application built with vanilla JavaScript, PHP, and no frameworks. Track your income, expenses, and recurring transactions with multi-currency support and beautiful visualizations.

![Budget Manager](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.0+-purple.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 💱 Multi-Currency Support
- **Default Currency**: ZAR (South African Rand)
- **10+ Supported Currencies**: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR
- **Real-time Conversion**: Automatic exchange rate updates
- **Smart Caching**: 1-hour cache to minimize API calls
- **Original Data Preservation**: Transactions stored in their original currency

### 🔄 Recurring Transactions
- **Daily**: Automatic daily transactions
- **Weekly**: Select specific days (Mon, Tue, Wed, etc.)
- **Bi-Weekly**: Every 2 weeks on selected days
- **Monthly**: Choose day of month (1-31, or 0 for last day)
- **Smart Scheduling**: Handles varying month lengths automatically

### 📊 Interactive Dashboards
- **Expense Breakdown**: Pie chart by category
- **Trend Analysis**: Line charts for income/expense trends
- **Balance Tracking**: Running balance over time
- **Custom Date Ranges**: Filter by date or financial month (24th to end of month)
- **Transaction History**: Searchable, filterable transaction list

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between themes
- **Split Button Design**: Compact Add/Recurring button
- **Responsive Layout**: Works on desktop and mobile
- **Smooth Animations**: Polished interactions
- **Date Picker**: Native calendar for easy date selection

### 🔐 Authentication
- **Google OAuth**: Sign in with Google
- **Traditional Login**: Username/password authentication
- **Password Recovery**: Security question-based reset
- **Session Management**: Secure PHP sessions

## 🚀 Quick Start

### Prerequisites
- PHP 8.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for currency conversion API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoeSeVis/budgeting-app.git
   cd budgeting-app
   ```

2. **Start the PHP server**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Create an account**
   - Register with username/password
   - Or sign in with Google

That's it! No database setup, no dependencies to install.

## 📁 Project Structure

```
budgeting-app/
├── api/                    # Backend API endpoints
│   ├── auth.php           # Authentication (login, register, Google OAuth)
│   ├── data.php           # Transaction CRUD operations
│   ├── settings.php       # User settings (currency, theme)
│   └── common.php         # Shared utilities
├── css/
│   └── style.css          # All styling (dark/light themes)
├── js/
│   ├── views/
│   │   ├── dashboard.js   # Main dashboard view
│   │   └── login.js       # Login/register view
│   ├── app.js             # Application entry point
│   ├── router.js          # Client-side routing
│   ├── currency.js        # Currency conversion logic
│   ├── charts.js          # Chart.js wrapper
│   ├── theme.js           # Theme management
│   └── api.js             # API client
├── utils/
│   └── storage.php        # JSON file storage utilities
├── data/                  # User data (gitignored)
├── index.html             # Single-page app entry
└── README.md
```

## 🎯 Usage

### Adding a Transaction
1. Fill in the transaction form (type, description, category, amount, date)
2. Click **"Add"** to save immediately
3. Or click the **dropdown arrow** → **"Make Recurring"** for recurring transactions

### Setting Up Recurring Transactions
1. Click the dropdown arrow next to "Add"
2. Select **"Make Recurring"**
3. Choose frequency:
   - **Daily**: No extra setup
   - **Weekly**: Check days of the week
   - **Bi-Weekly**: Check days for bi-weekly recurrence
   - **Monthly**: Enter day of month (0 = last day)
4. Click **"Add Recurring"**

### Switching Currencies
1. Click the currency selector in the header
2. Select your preferred currency
3. All amounts automatically convert
4. New transactions save in selected currency

### Viewing Reports
- **Expense Chart**: See spending breakdown by category
- **Main Dashboard**: Toggle between Income/Expense/Balance trends
- **Date Filters**: Use "Financial Month" or custom date ranges
- **Transaction History**: Filter and search past transactions

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript** (ES6 modules)
- **HTML5** (semantic markup)
- **CSS3** (custom properties, flexbox, grid)
- **Chart.js** (data visualization)

### Backend
- **PHP 8.0+** (built-in server)
- **JSON files** (data storage)
- **Session-based auth**

### APIs
- **ExchangeRate-API** (currency conversion)
- **Google OAuth 2.0** (authentication)

### Architecture
- **No frameworks** - lightweight and fast
- **Client-side routing** - SPA experience
- **RESTful API** - clean separation of concerns
- **Module pattern** - organized, maintainable code

## 🔧 Configuration

### Currency API
The app uses [ExchangeRate-API](https://www.exchangerate-api.com/) for currency conversion. No API key required for basic usage.

To change the API:
1. Edit `js/currency.js`
2. Update the `API_BASE_URL` constant
3. Modify the `fetchExchangeRates()` function if needed

### Google OAuth
To enable Google sign-in:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Update the client ID in `index.html`

### Default Currency
To change the default currency from ZAR:
1. Edit `js/currency.js`
2. Change `DEFAULT_CURRENCY` constant
3. Update currency symbols in `CURRENCY_SYMBOLS` if needed

## 📊 Data Storage

All data is stored in JSON files in the `data/` directory:
- `users.json` - User accounts
- `{user_id}_data.json` - User's transactions and categories

**Note**: The `data/` directory is excluded from Git via `.gitignore` to protect your privacy.

## 🔒 Security

- ✅ Password hashing with PHP's `password_hash()`
- ✅ Session-based authentication
- ✅ CSRF protection via session validation
- ✅ Input sanitization
- ✅ Secure file storage with exclusive locks
- ⚠️ **For production**: Use HTTPS, add rate limiting, implement proper database

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**JoeSeVis**
- GitHub: [@JoeSeVis](https://github.com/JoeSeVis)
- Email: joevdvyver@gmail.com

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [ExchangeRate-API](https://www.exchangerate-api.com/) for currency data
- Google for OAuth integration

---

**Built with ❤️ using vanilla JavaScript and PHP**
