const balance = document.getElementById('balance');
const income = document.getElementById('income');
const expense = document.getElementById('expense');
const list = document.getElementById('list');
const categorySummary = document.getElementById('category-summary');
const form = document.getElementById('transaction-form');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const date = document.getElementById('date');
const type = document.getElementsByName('type');
const recurring = document.getElementById('recurring');
const exportBtn = document.getElementById('export-btn');
const importInput = document.getElementById('import-input');

const localStorageTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
const localStorageRecurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
let transactions = localStorageTransactions;
let recurringTransactions = localStorageRecurringTransactions;

function addTransaction(e) {
    e.preventDefault();

    const selectedType = Array.from(type).find(radio => radio.checked).value;
    const transaction = {
        id: generateID(),
        amount: selectedType === 'income' ? +amount.value : -amount.value,
        category: category.value,
        date: date.value,
        type: selectedType,
        recurring: recurring.checked
    };

    if (transaction.recurring) {
        recurringTransactions.push(transaction);
        updateRecurringLocalStorage();
    } else {
        transactions.push(transaction);
        updateLocalStorage();
    }

    addTransactionDOM(transaction);
    updateValues();

    amount.value = '';
    category.value = 'select';
    date.value = '';
    Array.from(type).forEach(radio => radio.checked = false);
    recurring.checked = false;
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');

    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
        ${transaction.category} <span>${sign}${Math.abs(transaction.amount)}</span>
        <span>${transaction.date}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id}, ${transaction.recurring})">x</button>
    `;

    list.appendChild(item);
}

function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const incomeTotal = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);
    const expenseTotal = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `$${total}`;
    income.innerText = `$${incomeTotal}`;
    expense.innerText = `$${expenseTotal}`;

    updateCategorySummary();
}

function updateCategorySummary() {
    categorySummary.innerHTML = '';

    const categories = transactions.reduce((acc, transaction) => {
        const category = transaction.category;
        const amount = transaction.amount;

        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += amount;

        return acc;
    }, {});

    for (const [category, amount] of Object.entries(categories)) {
        const sign = amount < 0 ? '-' : '+';
        const item = document.createElement('li');
        item.innerHTML = `${category}: ${sign}${Math.abs(amount).toFixed(2)}`;
        categorySummary.appendChild(item);
    }
}

function removeTransaction(id, isRecurring) {
    if (isRecurring) {
        recurringTransactions = recurringTransactions.filter(transaction => transaction.id !== id);
        updateRecurringLocalStorage();
    } else {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
    }
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateRecurringLocalStorage() {
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
}

function init() {
    list.innerHTML = '';
    applyRecurringTransactions();
    transactions.forEach(addTransactionDOM);
    updateValues();
}

function applyRecurringTransactions() {
    const today = new Date().toISOString().split('T')[0];
    recurringTransactions.forEach(transaction => {
        if (new Date(transaction.date) <= new Date(today)) {
            const recurringTransaction = { ...transaction, id: generateID(), date: today };
            transactions.push(recurringTransaction);
        }
    });
    updateLocalStorage();
}

function exportData() {
    const data = JSON.stringify({ transactions, recurringTransactions });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const importedData = JSON.parse(event.target.result);
        transactions = importedData.transactions || [];
        recurringTransactions = importedData.recurringTransactions || [];
        updateLocalStorage();
        updateRecurringLocalStorage();
        init();
    };

    reader.readAsText(file);
}

form.addEventListener('submit', addTransaction);
exportBtn.addEventListener('click', exportData);
importInput.addEventListener('change', importData);

init();
