import { navigate } from '../router.js';
import { toggleTheme } from '../theme.js';
import { renderExpenseChart, renderTrendChart } from '../charts.js';
import { getDisplayCurrency, setDisplayCurrency, formatCurrency, getSupportedCurrencies, convertTransactionAmount } from '../currency.js';

let transactions = [];
let incomeCategories = [];
let expenseCategories = [];
let expenseChart = null;
let trendChart = null;
let historyLimit = 25;
let mainChart = null;

export async function renderDashboard() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="dashboard-container">
            <header>
                <h1>Hi there, <span id="user-greeting">User</span></h1>
                <div class="controls">
                    <div class="funds-display">
                        <span>Available Funds:</span>
                        <span id="available-funds" class="funds-amount">R0.00</span>
                    </div>
                    <select id="currency-selector" class="currency-select">
                        <!-- Currency options injected here -->
                    </select>
                    <button id="theme-toggle" class="icon-btn" aria-label="Toggle Theme">
                        <span class="theme-icon-sun">☀️</span>
                        <span class="theme-icon-moon">🌙</span>
                    </button>
                    <button id="logout-btn">Logout</button>
                </div>
            </header>

            <!-- Top Section: Inline Add Transaction -->
            <div class="add-transaction-section">
                <h2>Add Transaction</h2>
                <form id="inline-transaction-form">
                    <select id="t-type" required>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                    <input type="text" id="t-description" placeholder="Description" required>
                    <select id="t-category" required>
                        <!-- Categories injected here -->
                    </select>
                    <input type="text" id="t-new-category" placeholder="New Category (optional)" style="display:none;">
                    <input type="number" id="t-amount" step="0.01" placeholder="Amount" required>
                    <input type="date" id="t-date" value="${new Date().toISOString().split('T')[0]}" required>
                    
                    <div class="split-button-container">
                        <button type="submit" id="add-btn" class="add-btn">Add</button>
                        <button type="button" id="add-dropdown-btn" class="add-dropdown-btn">▼</button>
                        <div id="add-dropdown-menu" class="dropdown-menu" style="display:none;">
                            <button type="button" id="make-recurring-option">Make Recurring</button>
                        </div>
                    </div>
                </form>
                
                <!-- Recurring Options Section (Hidden by default) -->
                <div id="recurring-section" class="recurring-section" style="display:none;">
                    <h3>Recurring Transaction Settings</h3>
                    <div class="recurring-form">
                        <label>Frequency:</label>
                        <select id="r-frequency">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        
                        <!-- Weekly Days Selection -->
                        <div id="weekly-days" class="day-selection" style="display:none;">
                            <label>Select Days:</label>
                            <div class="days-grid">
                                <label><input type="checkbox" value="1"> Mon</label>
                                <label><input type="checkbox" value="2"> Tue</label>
                                <label><input type="checkbox" value="3"> Wed</label>
                                <label><input type="checkbox" value="4"> Thu</label>
                                <label><input type="checkbox" value="5"> Fri</label>
                                <label><input type="checkbox" value="6"> Sat</label>
                                <label><input type="checkbox" value="0"> Sun</label>
                            </div>
                        </div>
                        
                        <!-- Biweekly Days Selection -->
                        <div id="biweekly-days" class="day-selection" style="display:none;">
                            <label>Select Days:</label>
                            <div class="days-grid">
                                <label><input type="checkbox" value="1"> Mon</label>
                                <label><input type="checkbox" value="2"> Tue</label>
                                <label><input type="checkbox" value="3"> Wed</label>
                                <label><input type="checkbox" value="4"> Thu</label>
                                <label><input type="checkbox" value="5"> Fri</label>
                                <label><input type="checkbox" value="6"> Sat</label>
                                <label><input type="checkbox" value="0"> Sun</label>
                            </div>
                        </div>
                        
                        <!-- Monthly Day Selection -->
                        <div id="monthly-day" style="display:none;">
                            <label>Day of Month (0 = last day):</label>
                            <input type="number" id="r-day-of-month" min="0" max="31" placeholder="1-31, or 0 for last day">
                        </div>
                        
                        <button type="button" id="add-recurring-btn" class="primary-btn">Add Recurring</button>
                    </div>
                </div>
            </div>

            <!-- Middle Section: Split View -->
            <div class="middle-section">
                <!-- Left: Transaction History -->
                <div class="history-section">
                    <div class="section-header">
                        <h2>History</h2>
                        <div class="date-filter">
                            <input type="date" id="history-start">
                            <input type="date" id="history-end">
                            <button id="apply-history-filter">Filter</button>
                        </div>
                    </div>
                    <table id="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-body">
                            <!-- Rows injected here -->
                        </tbody>
                    </table>
                    <button id="show-more-btn" class="secondary-btn">Show More</button>
                </div>

                <!-- Right: Expenses per Category -->
                <div class="category-chart-section">
                    <h2>Expenses by Category</h2>
                    <div class="chart-wrapper">
                        <canvas id="expense-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Bottom Section: Interactive Dashboards -->
            <div class="bottom-section">
                <div class="section-header">
                    <h2>Trends & Analysis</h2>
                    <div class="dashboard-controls">
                        <select id="chart-type">
                            <option value="trend">Income vs Expenses</option>
                            <option value="balance">Remaining Balance</option>
                        </select>
                        <select id="time-range">
                            <option value="current-month">Current Financial Month</option>
                            <option value="last-3-months">Last 3 Months</option>
                            <option value="custom">Custom</option>
                        </select>
                        <div id="custom-range" class="hidden">
                            <input type="date" id="chart-start">
                            <input type="date" id="chart-end">
                            <button id="apply-chart-filter">Apply</button>
                        </div>
                    </div>
                </div>
                <div class="chart-wrapper full-width">
                    <canvas id="main-dashboard-chart"></canvas>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
    await loadData();

    // Set user name
    const user = await import('../api.js').then(m => m.checkSession());
    if (user) {
        document.getElementById('user-greeting').textContent = user;
    }
}

function setupEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api/auth.php?action=logout');
        navigate('login');
    });

    // Currency Selector
    const currencySelector = document.getElementById('currency-selector');
    currencySelector.addEventListener('change', async (e) => {
        setDisplayCurrency(e.target.value);
        await loadData(); // Reload to convert all amounts
    });

    // Inline Transaction Form
    document.getElementById('inline-transaction-form').addEventListener('submit', handleTransactionSubmit);

    // Category Select Logic
    const typeSelect = document.getElementById('t-type');
    const categorySelect = document.getElementById('t-category');

    typeSelect.addEventListener('change', () => {
        updateCategorySelects();
    });

    // Split Button Dropdown
    const dropdownBtn = document.getElementById('add-dropdown-btn');
    const dropdownMenu = document.getElementById('add-dropdown-menu');

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });

    // Make Recurring Option
    document.getElementById('make-recurring-option').addEventListener('click', () => {
        document.getElementById('recurring-section').style.display = 'block';
        dropdownMenu.style.display = 'none';
        updateRecurringInputs();
    });

    // Add Recurring Button (replaces Cancel)
    document.getElementById('add-recurring-btn').addEventListener('click', async () => {
        await handleRecurringSubmit();
    });

    // Recurring Frequency Change
    document.getElementById('r-frequency').addEventListener('change', updateRecurringInputs);

    // Date Picker Enhancement
    const dateInput = document.getElementById('t-date');
    dateInput.addEventListener('click', function () {
        this.showPicker();
    });

    categorySelect.addEventListener('change', (e) => {
        const newInput = document.getElementById('t-new-category');
        if (e.target.value === 'new') {
            newInput.style.display = 'block';
            newInput.required = true;
        } else {
            newInput.style.display = 'none';
            newInput.required = false;
        }
    });

    // History Filters
    document.getElementById('apply-history-filter').addEventListener('click', () => {
        renderTransactions();
    });

    document.getElementById('show-more-btn').addEventListener('click', () => {
        historyLimit += 25;
        renderTransactions();
    });

    // Dashboard Controls
    document.getElementById('chart-type').addEventListener('change', renderMainChart);
    document.getElementById('time-range').addEventListener('change', (e) => {
        const customRange = document.getElementById('custom-range');
        if (e.target.value === 'custom') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
            renderMainChart();
        }
    });
    document.getElementById('apply-chart-filter').addEventListener('click', renderMainChart);
}

function updateRecurringInputs() {
    const frequency = document.getElementById('r-frequency').value;
    const weeklyDays = document.getElementById('weekly-days');
    const biweeklyDays = document.getElementById('biweekly-days');
    const monthlyDay = document.getElementById('monthly-day');

    // Hide all
    weeklyDays.style.display = 'none';
    biweeklyDays.style.display = 'none';
    monthlyDay.style.display = 'none';

    // Show relevant input
    if (frequency === 'weekly') {
        weeklyDays.style.display = 'block';
    } else if (frequency === 'biweekly') {
        biweeklyDays.style.display = 'block';
    } else if (frequency === 'monthly') {
        monthlyDay.style.display = 'block';
    }
}

function updateCustomScheduleInputs() {
    const customType = document.getElementById('custom-type').value;
    const dayOfMonthInput = document.getElementById('day-of-month');
    const dayOfWeekSelect = document.getElementById('day-of-week');
    const biweeklyDaySelect = document.getElementById('biweekly-day');

    // Hide all
    dayOfMonthInput.style.display = 'none';
    dayOfWeekSelect.style.display = 'none';
    biweeklyDaySelect.style.display = 'none';

    // Show relevant input
    if (customType === 'day_of_month') {
        dayOfMonthInput.style.display = 'block';
    } else if (customType === 'day_of_week') {
        dayOfWeekSelect.style.display = 'block';
    } else if (customType === 'biweekly') {
        biweeklyDaySelect.style.display = 'block';
    }
}

async function loadData() {
    try {
        const res = await fetch('api/data.php?action=get_all');
        const data = await res.json();
        transactions = data.transactions || [];
        incomeCategories = data.income_categories || [];
        expenseCategories = data.expense_categories || [];

        // Populate currency selector
        const currencySelector = document.getElementById('currency-selector');
        const currencies = getSupportedCurrencies();
        const displayCurrency = getDisplayCurrency();

        currencySelector.innerHTML = '';
        currencies.forEach(curr => {
            const option = document.createElement('option');
            option.value = curr;
            option.textContent = curr;
            if (curr === displayCurrency) {
                option.selected = true;
            }
            currencySelector.appendChild(option);
        });

        updateCategorySelects();
        await renderTransactions();
        renderExpenseChartWidget();
        renderMainChart();
        await updateAvailableFunds();
    } catch (e) {
        console.error('Failed to load data', e);
    }
}

function updateCategorySelects() {
    const type = document.getElementById('t-type').value;
    const select = document.getElementById('t-category');
    const list = type === 'income' ? incomeCategories : expenseCategories;

    select.innerHTML = '';
    list.forEach(c => {
        select.innerHTML += `<option value="${c}">${c}</option>`;
    });
    select.innerHTML += '<option value="new">+ New Category</option>';
}

async function updateAvailableFunds() {
    let totalIncome = 0;
    let totalExpense = 0;

    // Convert all transactions to display currency
    for (const t of transactions) {
        const convertedAmount = await convertTransactionAmount(t);
        if (t.type === 'income') {
            totalIncome += convertedAmount;
        } else {
            totalExpense += convertedAmount;
        }
    }

    const balance = totalIncome - totalExpense;

    const el = document.getElementById('available-funds');
    el.textContent = formatCurrency(balance);
    el.className = balance >= 0 ? 'funds-amount positive' : 'funds-amount negative';
}

function getFinancialMonthRange() {
    const today = new Date();
    let start = new Date(today.getFullYear(), today.getMonth() - 1, 24);
    let end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month

    // If today is before the 24th, we are in the previous financial month cycle
    if (today.getDate() < 24) {
        start = new Date(today.getFullYear(), today.getMonth() - 2, 24);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    return { start, end };
}

function getDateRange() {
    const rangeType = document.getElementById('time-range').value;

    if (rangeType === 'custom') {
        const start = document.getElementById('chart-start').value;
        const end = document.getElementById('chart-end').value;
        return { start: start ? new Date(start) : null, end: end ? new Date(end) : null };
    }

    if (rangeType === 'last-3-months') {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        return { start, end };
    }

    // Default: Current Financial Month
    return getFinancialMonthRange();
}

async function renderTransactions() {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    const startFilter = document.getElementById('history-start').value;
    const endFilter = document.getElementById('history-end').value;

    let filtered = [...transactions];

    if (startFilter) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(startFilter));
    }
    if (endFilter) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(endFilter));
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const visible = filtered.slice(0, historyLimit);

    for (const t of visible) {
        const convertedAmount = await convertTransactionAmount(t);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td>${formatCurrency(convertedAmount)}</td>
            <td>
                <button class="delete-btn" data-id="${t.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Are you sure?')) {
                await deleteTransaction(e.target.dataset.id);
            }
        });
    });

    if (historyLimit >= filtered.length) {
        document.getElementById('show-more-btn').style.display = 'none';
    } else {
        document.getElementById('show-more-btn').style.display = 'block';
    }
}

function renderExpenseChartWidget() {
    const expenseByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

    const expenseData = {
        labels: Object.keys(expenseByCategory),
        values: Object.values(expenseByCategory),
        colors: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#2ecc71', '#e74c3c']
    };

    const ctx = document.getElementById('expense-chart').getContext('2d');
    if (expenseChart) expenseChart.destroy();
    expenseChart = renderExpenseChart(ctx, expenseData);
}

function renderMainChart() {
    const { start, end } = getDateRange();
    const type = document.getElementById('chart-type').value;

    let filtered = transactions;
    if (start && end) {
        filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });
    }

    const dates = [...new Set(filtered.map(t => t.date))].sort();

    let datasets = [];

    if (type === 'trend') {
        const incomeData = dates.map(d => {
            return filtered.filter(t => t.date === d && t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
        });
        const expenseData = dates.map(d => {
            return filtered.filter(t => t.date === d && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
        });

        datasets = [
            { label: 'Income', data: incomeData, borderColor: '#2ecc71', fill: false },
            { label: 'Expenses', data: expenseData, borderColor: '#e74c3c', fill: false }
        ];
    } else if (type === 'balance') {
        // Cumulative balance calculation
        let runningBalance = 0;
        const balanceData = dates.map(d => {
            const dayIncome = filtered.filter(t => t.date === d && t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const dayExpense = filtered.filter(t => t.date === d && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            runningBalance += (dayIncome - dayExpense);
            return runningBalance;
        });

        datasets = [
            { label: 'Balance', data: balanceData, borderColor: '#3498db', fill: true, backgroundColor: 'rgba(52, 152, 219, 0.2)' }
        ];
    }

    const chartData = { labels: dates, datasets };
    const ctx = document.getElementById('main-dashboard-chart').getContext('2d');

    if (mainChart) mainChart.destroy();
    mainChart = renderTrendChart(ctx, chartData);
}

async function handleRecurringSubmit() {
    const date = document.getElementById('t-date').value;
    const type = document.getElementById('t-type').value;
    let category = document.getElementById('t-category').value;
    const newCategory = document.getElementById('t-new-category').value;
    const amount = document.getElementById('t-amount').value;
    const description = document.getElementById('t-description').value;
    const currency = getDisplayCurrency();

    if (!date || !type || !category || !amount || !description) {
        alert('Please fill in all transaction fields');
        return;
    }

    if (category === 'new' && newCategory) {
        category = newCategory;
        await fetch('api/data.php?action=add_category', {
            method: 'POST',
            body: JSON.stringify({ category, type })
        });
    }

    const frequency = document.getElementById('r-frequency').value;
    const payload = {
        date, type, category, amount, description, frequency, tags: [], currency
    };

    // Get days of week for weekly/biweekly
    if (frequency === 'weekly') {
        const selectedDays = Array.from(document.querySelectorAll('#weekly-days input:checked'))
            .map(cb => parseInt(cb.value));
        if (selectedDays.length === 0) {
            alert('Please select at least one day for weekly recurring transaction');
            return;
        }
        payload.days_of_week = selectedDays;
    } else if (frequency === 'biweekly') {
        const selectedDays = Array.from(document.querySelectorAll('#biweekly-days input:checked'))
            .map(cb => parseInt(cb.value));
        if (selectedDays.length === 0) {
            alert('Please select at least one day for bi-weekly recurring transaction');
            return;
        }
        payload.days_of_week = selectedDays;
    } else if (frequency === 'monthly') {
        const dayOfMonth = parseInt(document.getElementById('r-day-of-month').value);
        if (isNaN(dayOfMonth) || dayOfMonth < 0 || dayOfMonth > 31) {
            alert('Please enter a valid day of month (0-31)');
            return;
        }
        payload.day_of_month = dayOfMonth;
    }

    try {
        await fetch('api/data.php?action=add_recurring_transaction', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        // Reset form
        document.getElementById('inline-transaction-form').reset();
        document.getElementById('t-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('recurring-section').style.display = 'none';
        document.querySelectorAll('#weekly-days input, #biweekly-days input').forEach(cb => cb.checked = false);
        document.getElementById('r-day-of-month').value = '';
        loadData();
    } catch (err) {
        console.error('Error saving recurring transaction', err);
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('t-date').value;
    const type = document.getElementById('t-type').value;
    let category = document.getElementById('t-category').value;
    const newCategory = document.getElementById('t-new-category').value;
    const amount = document.getElementById('t-amount').value;
    const description = document.getElementById('t-description').value;
    const currency = getDisplayCurrency();

    // Check if recurring section is visible
    const recurringSection = document.getElementById('recurring-section');
    const isRecurring = recurringSection.style.display !== 'none';

    if (category === 'new' && newCategory) {
        category = newCategory;
        await fetch('api/data.php?action=add_category', {
            method: 'POST',
            body: JSON.stringify({ category, type })
        });
    }

    if (isRecurring) {
        const frequency = document.getElementById('r-frequency').value;
        const payload = {
            date, type, category, amount, description, frequency, tags: [], currency
        };

        // Get days of week for weekly/biweekly
        if (frequency === 'weekly') {
            const selectedDays = Array.from(document.querySelectorAll('#weekly-days input:checked'))
                .map(cb => parseInt(cb.value));
            if (selectedDays.length === 0) {
                alert('Please select at least one day for weekly recurring transaction');
                return;
            }
            payload.days_of_week = selectedDays;
        } else if (frequency === 'biweekly') {
            const selectedDays = Array.from(document.querySelectorAll('#biweekly-days input:checked'))
                .map(cb => parseInt(cb.value));
            if (selectedDays.length === 0) {
                alert('Please select at least one day for bi-weekly recurring transaction');
                return;
            }
            payload.days_of_week = selectedDays;
        } else if (frequency === 'monthly') {
            const dayOfMonth = parseInt(document.getElementById('r-day-of-month').value);
            if (isNaN(dayOfMonth) || dayOfMonth < 0 || dayOfMonth > 31) {
                alert('Please enter a valid day of month (0-31)');
                return;
            }
            payload.day_of_month = dayOfMonth;
        }

        try {
            await fetch('api/data.php?action=add_recurring_transaction', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            // Reset form
            document.getElementById('inline-transaction-form').reset();
            document.getElementById('t-date').value = new Date().toISOString().split('T')[0];
            recurringSection.style.display = 'none';
            document.querySelectorAll('#weekly-days input, #biweekly-days input').forEach(cb => cb.checked = false);
            document.getElementById('r-day-of-month').value = '';
            loadData();
        } catch (err) {
            console.error('Error saving recurring transaction', err);
        }
        return;
    }

    const payload = {
        id: '', // New transaction
        date, type, category, amount, description, tags: [], currency
    };

    try {
        await fetch('api/data.php?action=add_transaction', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Reset form
        document.getElementById('inline-transaction-form').reset();
        document.getElementById('t-date').value = new Date().toISOString().split('T')[0];

        loadData();
    } catch (err) {
        console.error('Error saving transaction', err);
    }
}

async function deleteTransaction(id) {
    try {
        await fetch('api/data.php?action=delete_transaction', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        loadData();
    } catch (err) {
        console.error('Error deleting transaction', err);
    }
}
