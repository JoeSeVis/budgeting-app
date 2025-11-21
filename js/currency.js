// Currency conversion and formatting module

const CURRENCY_SYMBOLS = {
    'ZAR': 'R',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'Fr',
    'CNY': '¥',
    'INR': '₹'
};

const DEFAULT_CURRENCY = 'ZAR';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

let exchangeRates = null;
let lastFetchTime = null;
let baseCurrency = 'ZAR';

// Get user's preferred display currency
export function getDisplayCurrency() {
    return localStorage.getItem('display_currency') || DEFAULT_CURRENCY;
}

// Set user's preferred display currency
export function setDisplayCurrency(currency) {
    localStorage.setItem('display_currency', currency);
}

// Fetch exchange rates from API
async function fetchExchangeRates() {
    try {
        const response = await fetch(`${API_URL}${baseCurrency}`);
        const data = await response.json();

        exchangeRates = data.rates;
        lastFetchTime = Date.now();

        // Cache the rates
        localStorage.setItem('exchange_rates', JSON.stringify(exchangeRates));
        localStorage.setItem('exchange_rates_time', lastFetchTime.toString());

        return exchangeRates;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Try to use cached rates
        const cached = localStorage.getItem('exchange_rates');
        if (cached) {
            exchangeRates = JSON.parse(cached);
            return exchangeRates;
        }
        return null;
    }
}

// Get exchange rates (from cache or API)
async function getExchangeRates() {
    const now = Date.now();

    // Check if we have cached rates that are still valid
    if (exchangeRates && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
        return exchangeRates;
    }

    // Try to load from localStorage
    const cachedRates = localStorage.getItem('exchange_rates');
    const cachedTime = localStorage.getItem('exchange_rates_time');

    if (cachedRates && cachedTime) {
        const cacheAge = now - parseInt(cachedTime);
        if (cacheAge < CACHE_DURATION) {
            exchangeRates = JSON.parse(cachedRates);
            lastFetchTime = parseInt(cachedTime);
            return exchangeRates;
        }
    }

    // Fetch fresh rates
    return await fetchExchangeRates();
}

// Convert amount from one currency to another
export async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const rates = await getExchangeRates();
    if (!rates) {
        console.warn('Exchange rates not available, returning original amount');
        return amount;
    }

    // Convert to base currency (ZAR) first, then to target currency
    const inBase = amount / (rates[fromCurrency] || 1);
    const converted = inBase * (rates[toCurrency] || 1);

    return converted;
}

// Format amount with currency symbol
export function formatCurrency(amount, currency = null) {
    const curr = currency || getDisplayCurrency();
    const symbol = CURRENCY_SYMBOLS[curr] || curr;

    // Format with 2 decimal places
    const formatted = Math.abs(amount).toFixed(2);

    // Add thousand separators
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${parts.join('.')}`;
}

// Get list of supported currencies
export function getSupportedCurrencies() {
    return Object.keys(CURRENCY_SYMBOLS);
}

// Get currency symbol
export function getCurrencySymbol(currency) {
    return CURRENCY_SYMBOLS[currency] || currency;
}

// Convert transaction amount for display
export async function convertTransactionAmount(transaction) {
    const displayCurrency = getDisplayCurrency();
    const transactionCurrency = transaction.currency || DEFAULT_CURRENCY;

    if (transactionCurrency === displayCurrency) {
        return transaction.amount;
    }

    return await convertCurrency(transaction.amount, transactionCurrency, displayCurrency);
}

// Refresh exchange rates (force fetch)
export async function refreshExchangeRates() {
    lastFetchTime = null;
    return await fetchExchangeRates();
}
