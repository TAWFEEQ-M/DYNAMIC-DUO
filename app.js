(() => {
  'use strict';

  const STORAGE_KEY = 'moneywise-ai-v1';
  const MAX_AMOUNT = 100000000;
  const CATEGORIES = {
    expense: ['Food', 'Housing', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Personal care', 'Other'],
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']
  };
  const CATEGORY_COLORS = ['#9ce6bd', '#f08b7c', '#83bde2', '#e9bd72', '#bc9fe4', '#f0a8c3', '#79d2ce', '#c2cf83', '#e4a77c', '#9aa9b3'];
  const CATEGORY_ICONS = { Food: '◒', Housing: '⌂', Transport: '↗', Shopping: '◇', Bills: 'ϟ', Health: '+', Entertainment: '♫', Education: '▤', 'Personal care': '✦', Salary: '↙', Freelance: '⌘', Business: '▧', Investment: '↗', Gift: '♡', Other: '·' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const today = new Date();
  const todayISO = toISODate(today);
  const currentMonth = monthKey(today);
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const moneyExact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const compactMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'short' });
  const monthLongFormat = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
  let storageWarning = false;
  let activeStorageKey = STORAGE_KEY;
  let activeEmail = '';
  let state = loadState(STORAGE_KEY);
  let selectedMonth = currentMonth;
  let toastTimer;
  let demoSignedIn = false;
  let statementRows = [];
  let renderScheduled = false;

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthOffset(key, offset) {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    return monthKey(date);
  }

  function dateForMonth(key, day) {
    const [year, month] = key.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${key}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }

  function validDate(value) {
    if (typeof value !== 'string') return false;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, year, month, day] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function uid() {
    return globalThis.crypto?.randomUUID?.() || `mw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function seedState() {
    const m0 = currentMonth;
    const m1 = monthOffset(m0, -1);
    const m2 = monthOffset(m0, -2);
    const m3 = monthOffset(m0, -3);
    const m4 = monthOffset(m0, -4);
    const m5 = monthOffset(m0, -5);
    const records = [
      ['Monthly salary', 68000, 'Salary', 'income', m0, 1],
      ['Neighborhood market', 1240, 'Food', 'expense', m0, 2],
      ['Apartment rent', 14000, 'Housing', 'expense', m0, 3],
      ['Metro card recharge', 850, 'Transport', 'expense', m0, 4],
      ['Lunch with the team', 780, 'Food', 'expense', m0, 5],
      ['Electricity bill', 1650, 'Bills', 'expense', m0, 6],
      ['Weekend groceries', 1530, 'Food', 'expense', m0, 7],
      ['Running shoes', 2890, 'Shopping', 'expense', m0, 9],
      ['Freelance project', 8500, 'Freelance', 'income', m0, 10],
      ['Dinner with friends', 660, 'Food', 'expense', m0, 11],
      ['Internet plan', 999, 'Bills', 'expense', m0, 12],
      ['Pharmacy', 420, 'Health', 'expense', m0, 13],
      ['Cab across town', 560, 'Transport', 'expense', m0, 14],
      ['Streaming subscription', 499, 'Entertainment', 'expense', m0, 15],
      ['Monthly salary', 68000, 'Salary', 'income', m1, 1],
      ['Rent and maintenance', 14000, 'Housing', 'expense', m1, 3],
      ['Groceries and meals', 3120, 'Food', 'expense', m1, 8],
      ['Monthly salary', 68000, 'Salary', 'income', m2, 1],
      ['Home essentials', 2210, 'Shopping', 'expense', m2, 5],
      ['Monthly salary', 65000, 'Salary', 'income', m3, 1],
      ['Festival travel', 3850, 'Transport', 'expense', m3, 12],
      ['Monthly salary', 65000, 'Salary', 'income', m4, 1],
      ['Monthly salary', 65000, 'Salary', 'income', m5, 1]
    ].map(([description, amount, category, type, month, day]) => ({ id: uid(), description, amount, category, type, date: dateForMonth(month, day), sample: true }));
    const budgets = [
      ['Food', 3000], ['Housing', 16000], ['Transport', 2500], ['Shopping', 3500], ['Bills', 2500], ['Health', 1500]
    ].map(([category, amount]) => ({ id: uid(), category, amount }));
    const goals = [
      { id: uid(), name: 'A weekend in the hills', target: 30000, deadline: dateForMonth(monthOffset(m0, 4), 20), contributions: [{ id: uid(), amount: 7000, date: dateForMonth(m0, 1) }, { id: uid(), amount: 2500, date: dateForMonth(m0, 8) }], sample: true },
      { id: uid(), name: 'The just-in-case fund', target: 100000, deadline: dateForMonth(monthOffset(m0, 10), 1), contributions: [{ id: uid(), amount: 18000, date: dateForMonth(m0, 3) }], sample: true }
    ];
    return { version: 1, transactions: records, budgets, goals, demo: true };
  }

  function normalizeTransaction(item) {
    if (!item || typeof item !== 'object') return null;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT || !validDate(item.date)) return null;
    const type = item.type === 'income' ? 'income' : item.type === 'expense' ? 'expense' : null;
    if (!type || !CATEGORIES[type].includes(item.category)) return null;
    const description = typeof item.description === 'string' ? item.description.trim().slice(0, 70) : '';
    if (!description) return null;
    return { id: typeof item.id === 'string' ? item.id : uid(), description, amount: Math.round(amount * 100) / 100, category: item.category, type, date: item.date, ...(item.sample === true ? { sample: true } : {}) };
  }

  function normalizeBudget(item) {
    if (!item || typeof item !== 'object' || !CATEGORIES.expense.includes(item.category)) return null;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return null;
    return { id: typeof item.id === 'string' ? item.id : uid(), category: item.category, amount: Math.round(amount * 100) / 100 };
  }

  function normalizeGoal(item) {
    if (!item || typeof item !== 'object') return null;
    const target = Number(item.target);
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 55) : '';
    if (!name || !Number.isFinite(target) || target <= 0 || target > MAX_AMOUNT || !validDate(item.deadline)) return null;
    const contributions = Array.isArray(item.contributions) ? item.contributions.map((contribution) => {
      const amount = Number(contribution?.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT || !validDate(contribution?.date)) return null;
      return { id: typeof contribution.id === 'string' ? contribution.id : uid(), amount: Math.round(amount * 100) / 100, date: contribution.date };
    }).filter(Boolean) : [];
    return { id: typeof item.id === 'string' ? item.id : uid(), name, target: Math.round(target * 100) / 100, deadline: item.deadline, contributions, ...(item.sample === true ? { sample: true } : {}) };
  }

  function loadState(storageKey = activeStorageKey) {
    let raw;
    try { raw = localStorage.getItem(storageKey); } catch { storageWarning = true; return storageKey === STORAGE_KEY ? seedState() : emptyState(); }
    if (raw === null) {
      const initial = storageKey === STORAGE_KEY ? seedState() : emptyState();
      try { localStorage.setItem(storageKey, JSON.stringify(initial)); } catch { storageWarning = true; }
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.budgets) || !Array.isArray(parsed.goals)) throw new Error('Unexpected saved data shape');
      return {
        version: 1,
        transactions: parsed.transactions.map(normalizeTransaction).filter(Boolean),
        budgets: parsed.budgets.map(normalizeBudget).filter(Boolean).filter((budget, index, list) => list.findIndex((other) => other.category === budget.category) === index),
        goals: parsed.goals.map(normalizeGoal).filter(Boolean),
        demo: parsed.demo === true
      };
    } catch {
      storageWarning = true;
      return { version: 1, transactions: [], budgets: [], goals: [], demo: false };
    }
  }

  function emptyState() {
    return { version: 1, transactions: [], budgets: [], goals: [], demo: false };
  }

  function profileStorageKey(email) {
    return `moneywise-ai-profile-v1:${encodeURIComponent(email)}`;
  }

  function saveState() {
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify({ version: 1, transactions: state.transactions, budgets: state.budgets, goals: state.goals, demo: state.demo }));
      storageWarning = false;
    } catch {
      storageWarning = true;
      showToast('Changes could not be saved. Browser storage may be unavailable or full.', true);
    }
  }

  function formatMoney(amount, exact = false) {
    return (exact ? moneyExact : money).format(Number.isFinite(amount) ? amount : 0);
  }

  function formatDate(value, includeYear = false) {
    if (!validDate(value)) return 'Invalid date';
    return dateFormat.format(new Date(`${value}T12:00:00`)).replace(/, /g, includeYear ? ', ' : ' ');
  }

  function formatMonth(key) {
    const [year, month] = key.split('-').map(Number);
    return monthLongFormat.format(new Date(year, month - 1, 1));
  }

  function escapeCSV(value) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`;
  }

  function isCurrentMonth(transaction, key = selectedMonth) {
    return transaction.date.slice(0, 7) === key;
  }

  function monthTransactions(key = selectedMonth) {
    return state.transactions.filter((transaction) => isCurrentMonth(transaction, key));
  }

  function monthTotals(key = selectedMonth) {
    const records = monthTransactions(key);
    return records.reduce((totals, record) => {
      totals[record.type] += record.amount;
      totals[`${record.type}Count`] += 1;
      return totals;
    }, { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });
  }

  function categoryTotals(key = selectedMonth) {
    const totals = new Map();
    monthTransactions(key).filter((record) => record.type === 'expense').forEach((record) => totals.set(record.category, (totals.get(record.category) || 0) + record.amount));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }

  function goalSaved(goal) {
    return goal.contributions.reduce((total, contribution) => total + contribution.amount, 0);
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
  }

  function showToast(message, isError = false) {
    const region = $('#toast-region');
    const toast = document.createElement('div');
    toast.className = `toast${isError ? ' error' : ''}`;
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }

  function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  function setupStaticControls() {
    $('#today-date').textContent = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(today).toUpperCase();
    const monthOptions = new Set([currentMonth]);
    state.transactions.forEach((record) => monthOptions.add(record.date.slice(0, 7)));
    for (let offset = -11; offset <= 1; offset += 1) monthOptions.add(monthOffset(currentMonth, offset));
    const months = [...monthOptions].sort().reverse();
    $$('#month-picker, .sync-month').forEach((select) => {
      select.replaceChildren();
      months.forEach((key) => addOption(select, key, formatMonth(key)));
      select.value = currentMonth;
      select.addEventListener('change', () => {
        selectedMonth = select.value;
        $$('#month-picker, .sync-month').forEach((other) => { other.value = selectedMonth; });
        renderAll();
      });
    });
    fillCategorySelect($('#transaction-category'), CATEGORIES.expense);
    fillCategorySelect($('#budget-category'), CATEGORIES.expense);
    updateTransactionCategoryOptions();
    $$('#type-filter, #category-filter, #sort-transactions, #transaction-search').forEach((element) => element.addEventListener('input', renderTransactions));
    $('#transaction-type').addEventListener('change', updateTransactionCategoryOptions);
    $('#export-csv').addEventListener('click', exportCSV);
    $('#quick-add').addEventListener('click', () => openTransactionDialog());
    $('#mobile-menu').addEventListener('click', toggleMobileMenu);
    $('#mobile-scrim').addEventListener('click', closeMobileMenu);
    $('#reset-demo').addEventListener('click', resetDemo);
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('resize', debounce(renderCharts, 120));
    window.addEventListener('storage', handleStorageChange);
    $('#transaction-form').addEventListener('submit', saveTransactionFromForm);
    $('#budget-form').addEventListener('submit', saveBudgetFromForm);
    $('#goal-form').addEventListener('submit', saveGoalFromForm);
    $('#contribution-form').addEventListener('submit', saveContributionFromForm);
    $('#login-form').addEventListener('submit', signInToDemo);
    $('#open-demo-workspace').addEventListener('click', openDemoWorkspace);
    $('#sign-out').addEventListener('click', signOutOfDemo);
    $('#statement-file').addEventListener('change', handleStatementFile);
    $('#statement-drop').addEventListener('dragover', (event) => { event.preventDefault(); $('#statement-drop').classList.add('drag-active'); });
    $('#statement-drop').addEventListener('dragleave', () => $('#statement-drop').classList.remove('drag-active'));
    $('#statement-drop').addEventListener('drop', (event) => {
      event.preventDefault();
      $('#statement-drop').classList.remove('drag-active');
      processStatementFile(event.dataTransfer?.files?.[0]);
    });
    $('#select-all-statement-rows').addEventListener('change', toggleAllStatementRows);
    $('#import-statement-rows').addEventListener('click', importStatementRows);
    $('#clear-statement-review').addEventListener('click', clearStatementReview);
  }

  function signInToDemo(event) {
    event.preventDefault();
    const emailInput = $('#login-email');
    const email = emailInput.value.trim();
    if (!email || !emailInput.validity.valid) {
      setText('#login-error', 'Enter a valid email address to continue to the demo.');
      emailInput.focus();
      return;
    }
    setText('#login-error', '');
    activeEmail = email.toLocaleLowerCase('en-US');
    activeStorageKey = profileStorageKey(activeEmail);
    state = loadState(activeStorageKey);
    selectedMonth = currentMonth;
    try { sessionStorage.setItem('moneywise-demo-session', activeEmail); } catch { /* The demo remains available for this page session. */ }
    demoSignedIn = true;
    $('#login-screen').hidden = true;
    $('.app-shell').hidden = false;
    setupMonthOptions();
    updateProfileLabel();
    history.replaceState(null, '', '#dashboard');
    setView('dashboard');
    window.requestAnimationFrame(renderCharts);
  }

  function openDemoWorkspace() {
    activeEmail = '';
    activeStorageKey = STORAGE_KEY;
    state = loadState(STORAGE_KEY);
    selectedMonth = currentMonth;
    try { sessionStorage.setItem('moneywise-demo-session', 'demo'); } catch { /* The demo remains available for this page session. */ }
    demoSignedIn = true;
    $('#login-screen').hidden = true;
    $('.app-shell').hidden = false;
    setupMonthOptions();
    updateProfileLabel();
    history.replaceState(null, '', '#dashboard');
    setView('dashboard');
    window.requestAnimationFrame(renderCharts);
  }

  function signOutOfDemo() {
    try { sessionStorage.removeItem('moneywise-demo-session'); } catch { /* In-memory sign-out still takes effect. */ }
    demoSignedIn = false;
    $('#login-form').reset();
    setText('#login-error', '');
    $('#login-screen').hidden = false;
    $('.app-shell').hidden = true;
    activeEmail = '';
    activeStorageKey = STORAGE_KEY;
    history.replaceState(null, '', '#login');
    $('#login-email').focus();
  }

  function fillCategorySelect(select, categories, selected = '') {
    const current = selected || select.value;
    select.replaceChildren();
    categories.forEach((category) => addOption(select, category, category));
    if (categories.includes(current)) select.value = current;
  }

  function updateTransactionCategoryOptions() {
    const type = $('#transaction-type').value;
    fillCategorySelect($('#transaction-category'), CATEGORIES[type], $('#transaction-category').value);
  }

  function setView(name) {
    const validViews = ['dashboard', 'transactions', 'statements', 'analytics', 'budgets', 'goals', 'coach'];
    if (!validViews.includes(name)) return;
    $$('.view').forEach((view) => {
      const active = view.id === `view-${name}`;
      view.hidden = !active;
      view.classList.toggle('active', active);
    });
    $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === name));
    const titles = { dashboard: 'Overview', transactions: 'Transactions', statements: 'Statement import', analytics: 'Analytics', budgets: 'Budgets', goals: 'Savings goals', coach: 'Money coach' };
    setText('#page-breadcrumb', titles[name]);
    history.replaceState(null, '', `#${name}`);
    closeMobileMenu();
    renderAll();
  }

  function toggleMobileMenu() {
    $('#sidebar').classList.toggle('open');
    $('#mobile-scrim').classList.toggle('visible');
  }

  function closeMobileMenu() {
    $('#sidebar').classList.remove('open');
    $('#mobile-scrim').classList.remove('visible');
  }

  function handleDocumentClick(event) {
    const nav = event.target.closest('[data-view]');
    if (nav) { setView(nav.dataset.view); return; }
    const jump = event.target.closest('[data-navigate]');
    if (jump) { setView(jump.dataset.navigate); return; }
    const open = event.target.closest('[data-open-dialog]');
    if (open) { openDialog(open.dataset.openDialog); return; }
    const close = event.target.closest('[data-close-dialog]');
    if (close) { close.closest('dialog')?.close(); return; }
    const rowAction = event.target.closest('[data-action]');
    if (rowAction) handleRowAction(rowAction.dataset.action, rowAction.dataset.id);
  }

  function openDialog(id) {
    if (id === 'transaction-dialog') openTransactionDialog();
    else if (id === 'budget-dialog') openBudgetDialog();
    else if (id === 'goal-dialog') openGoalDialog();
  }

  function openTransactionDialog(transaction = null) {
    const form = $('#transaction-form');
    form.reset();
    $('#transaction-id').value = transaction?.id || '';
    $('#transaction-dialog-title').textContent = transaction ? 'Edit transaction' : 'Add transaction';
    $('#transaction-description').value = transaction?.description || '';
    $('#transaction-amount').value = transaction?.amount ?? '';
    $('#transaction-type').value = transaction?.type || 'expense';
    updateTransactionCategoryOptions();
    $('#transaction-category').value = transaction?.category || CATEGORIES.expense[0];
    $('#transaction-date').value = transaction?.date || todayISO;
    setText('#transaction-error', '');
    $('#transaction-dialog').showModal();
    $('#transaction-description').focus();
  }

  function openBudgetDialog(budget = null) {
    $('#budget-form').reset();
    $('#budget-id').value = budget?.id || '';
    $('#budget-dialog-title').textContent = budget ? 'Edit budget' : 'Create budget';
    const currentCategories = state.budgets.filter((item) => item.id !== budget?.id).map((item) => item.category);
    const available = CATEGORIES.expense.filter((category) => !currentCategories.includes(category));
    fillCategorySelect($('#budget-category'), available, budget?.category || available[0]);
    $('#budget-amount').value = budget?.amount ?? '';
    setText('#budget-error', '');
    $('#budget-dialog').showModal();
    $('#budget-amount').focus();
  }

  function openGoalDialog(goal = null) {
    $('#goal-form').reset();
    $('#goal-id').value = goal?.id || '';
    $('#goal-dialog-title').textContent = goal ? 'Edit savings goal' : 'Create savings goal';
    $('#goal-name').value = goal?.name || '';
    $('#goal-target').value = goal?.target ?? '';
    $('#goal-deadline').value = goal?.deadline || dateForMonth(monthOffset(currentMonth, 3), 1);
    setText('#goal-error', '');
    $('#goal-dialog').showModal();
    $('#goal-name').focus();
  }

  function openContributionDialog(goal) {
    $('#contribution-form').reset();
    $('#contribution-goal-id').value = goal.id;
    setText('#contribution-goal-label', `${goal.name} · ${formatMoney(goal.target - goalSaved(goal))} remaining`);
    $('#contribution-date').value = todayISO;
    setText('#contribution-error', '');
    $('#contribution-dialog').showModal();
    $('#contribution-amount').focus();
  }

  function parseAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 && amount <= MAX_AMOUNT ? Math.round(amount * 100) / 100 : null;
  }

  function saveTransactionFromForm(event) {
    event.preventDefault();
    const id = $('#transaction-id').value;
    const description = $('#transaction-description').value.trim();
    const amount = parseAmount($('#transaction-amount').value);
    const type = $('#transaction-type').value;
    const category = $('#transaction-category').value;
    const date = $('#transaction-date').value;
    const error = !description ? 'Add a short description.' : !amount ? 'Enter an amount greater than ₹0 and no more than ₹10 crore.' : !CATEGORIES[type]?.includes(category) ? 'Choose a valid category.' : !validDate(date) || date > todayISO ? 'Choose a valid date that is not in the future.' : '';
    if (error) { setText('#transaction-error', error); return; }
    const previous = state.transactions.find((item) => item.id === id);
    const record = { id: previous?.id || uid(), description, amount, category, type, date, ...(previous?.sample ? { sample: true } : {}) };
    if (previous) state.transactions = state.transactions.map((item) => item.id === id ? record : item);
    else state.transactions.push(record);
    state.demo = state.transactions.some((item) => item.sample);
    persistAndRender();
    $('#transaction-dialog').close();
    showToast(previous ? 'Transaction updated.' : 'Transaction added.');
  }

  function saveBudgetFromForm(event) {
    event.preventDefault();
    const id = $('#budget-id').value;
    const category = $('#budget-category').value;
    const amount = parseAmount($('#budget-amount').value);
    const duplicate = state.budgets.some((item) => item.category === category && item.id !== id);
    const error = !CATEGORIES.expense.includes(category) ? 'Choose a valid expense category.' : !amount ? 'Enter a monthly limit greater than ₹0.' : duplicate ? 'A budget already exists for this category.' : '';
    if (error) { setText('#budget-error', error); return; }
    const budget = { id: id || uid(), category, amount };
    if (id) state.budgets = state.budgets.map((item) => item.id === id ? budget : item);
    else state.budgets.push(budget);
    persistAndRender();
    $('#budget-dialog').close();
    showToast(id ? 'Budget updated.' : 'Budget created.');
  }

  function saveGoalFromForm(event) {
    event.preventDefault();
    const id = $('#goal-id').value;
    const name = $('#goal-name').value.trim();
    const target = parseAmount($('#goal-target').value);
    const deadline = $('#goal-deadline').value;
    const error = !name ? 'Give this goal a name.' : !target ? 'Enter a target greater than ₹0.' : !validDate(deadline) ? 'Choose a valid deadline.' : '';
    if (error) { setText('#goal-error', error); return; }
    const previous = state.goals.find((item) => item.id === id);
    const goal = { id: previous?.id || uid(), name, target, deadline, contributions: previous?.contributions || [], ...(previous?.sample ? { sample: true } : {}) };
    if (previous) state.goals = state.goals.map((item) => item.id === id ? goal : item);
    else state.goals.push(goal);
    persistAndRender();
    $('#goal-dialog').close();
    showToast(previous ? 'Savings goal updated.' : 'Savings goal created.');
  }

  function saveContributionFromForm(event) {
    event.preventDefault();
    const goal = state.goals.find((item) => item.id === $('#contribution-goal-id').value);
    const amount = parseAmount($('#contribution-amount').value);
    const date = $('#contribution-date').value;
    const remaining = goal ? Math.max(0, goal.target - goalSaved(goal)) : 0;
    const error = !goal ? 'This savings goal no longer exists.' : !amount ? 'Enter an amount greater than ₹0.' : amount > remaining ? `This goal has ${formatMoney(remaining)} remaining. Lower the contribution amount.` : !validDate(date) || date > todayISO ? 'Choose a valid date that is not in the future.' : '';
    if (error) { setText('#contribution-error', error); return; }
    goal.contributions.push({ id: uid(), amount, date });
    persistAndRender();
    $('#contribution-dialog').close();
    showToast('Contribution added to your goal.');
  }

  function handleRowAction(action, id) {
    const transaction = state.transactions.find((item) => item.id === id);
    const budget = state.budgets.find((item) => item.id === id);
    const goal = state.goals.find((item) => item.id === id);
    if (action === 'edit-transaction' && transaction) openTransactionDialog(transaction);
    if (action === 'delete-transaction' && transaction && window.confirm(`Delete “${transaction.description}”? This cannot be undone.`)) {
      state.transactions = state.transactions.filter((item) => item.id !== id);
      state.demo = state.transactions.some((item) => item.sample);
      persistAndRender(); showToast('Transaction deleted.');
    }
    if (action === 'edit-budget' && budget) openBudgetDialog(budget);
    if (action === 'delete-budget' && budget && window.confirm(`Delete the ${budget.category} budget?`)) {
      state.budgets = state.budgets.filter((item) => item.id !== id);
      persistAndRender(); showToast('Budget deleted.');
    }
    if (action === 'edit-goal' && goal) openGoalDialog(goal);
    if (action === 'contribute' && goal) openContributionDialog(goal);
    if (action === 'delete-goal' && goal && window.confirm(`Delete “${goal.name}” and its contribution history?`)) {
      state.goals = state.goals.filter((item) => item.id !== id);
      persistAndRender(); showToast('Savings goal deleted.');
    }
  }

  function persistAndRender() {
    saveState();
    scheduleRender();
  }

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      renderAll();
    });
  }

  function resetDemo() {
    if (activeEmail) {
      showToast('Demo reset only affects the shared demonstration workspace. Your private profile was left unchanged.', true);
      return;
    }
    const confirmed = window.confirm('Reset this browser workspace to the original MoneyWise demonstration data? All current transactions, budgets, and goals in this browser will be replaced.');
    if (!confirmed) return;
    state = seedState();
    selectedMonth = currentMonth;
    saveState();
    setupMonthOptions();
    renderAll();
    showToast('Demonstration data restored.');
  }

  function setupMonthOptions() {
    const months = new Set([currentMonth]);
    state.transactions.forEach((record) => months.add(record.date.slice(0, 7)));
    for (let offset = -11; offset <= 1; offset += 1) months.add(monthOffset(currentMonth, offset));
    $$('#month-picker, .sync-month').forEach((select) => {
      select.replaceChildren();
      [...months].sort().reverse().forEach((key) => addOption(select, key, formatMonth(key)));
      select.value = selectedMonth;
    });
  }

  function renderAll() {
    setText('#sample-badge', state.transactions.some((item) => item.sample) ? 'SAMPLE DATA' : 'YOUR DATA');
    $('#sample-badge').classList.toggle('user-data-pill', !state.transactions.some((item) => item.sample));
    updateProfileLabel();
    renderDashboard();
    renderTransactions();
    renderAnalytics();
    renderBudgets();
    renderGoals();
    renderCoach();
    renderCharts();
  }

  function scheduleUpdate() {
    scheduleRender();
  }

  async function handleStatementFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    processStatementFile(file);
  }

  async function processStatementFile(file) {
    if (!file) return;
    if (!file.name.toLocaleLowerCase('en-US').endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      showStatementStatus('Choose a PDF file to continue.', true);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showStatementStatus('This file is larger than 20 MB. Choose a smaller statement PDF.', true);
      return;
    }
    showStatementStatus('Reading statement locally…', false);
    $('#statement-review').hidden = true;
    try {
      if (!globalThis.pdfjsLib) {
        const pdfModule = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/legacy/build/pdf.mjs');
        globalThis.pdfjsLib = pdfModule;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/legacy/build/pdf.worker.mjs';
      const documentTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
      const pdf = await documentTask.promise;
      if (pdf.numPages > 100) throw new Error('This statement has more than 100 pages. Split it into smaller PDFs and try again.');
      const lines = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        lines.push(...textItemsToLines(content.items));
      }
      statementRows = parseStatementLines(lines);
      renderStatementPreview(file.name);
      if (!statementRows.length) showStatementStatus('No transaction rows could be confidently extracted. This may be a scanned PDF or an unsupported statement layout; nothing was imported.', true);
      else showStatementStatus(`Read ${statementRows.length} possible transaction${statementRows.length === 1 ? '' : 's'} from ${file.name}. Review the rows before importing.`, false);
    } catch (error) {
      statementRows = [];
      renderStatementPreview(file.name);
      showStatementStatus(error?.message || 'This PDF could not be read. It may be encrypted, damaged, or image-only.', true);
    }
  }

  function textItemsToLines(items) {
    const positioned = items.filter((item) => typeof item.str === 'string' && item.str.trim()).map((item) => ({
      text: item.str.trim(), x: Number(item.transform?.[4]) || 0, y: Number(item.transform?.[5]) || 0
    })).sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    positioned.forEach((item) => {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) < 3);
      if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
      row.items.push(item);
    });
    return rows.sort((a, b) => b.y - a.y).map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim());
  }

  function parseStatementDate(value) {
    const clean = value.trim().replace(/[.]/g, '-').replace(/\//g, '-');
    let match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    match = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (match) {
      let year = Number(match[3]);
      if (year < 100) year += year >= 70 ? 1900 : 2000;
      const dayFirst = Number(match[1]);
      const month = Number(match[2]);
      return `${year}-${String(month).padStart(2, '0')}-${String(dayFirst).padStart(2, '0')}`;
    }
    match = value.match(/^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{2,4})$/);
    if (match) {
      let year = Number(match[3]);
      if (year < 100) year += year >= 70 ? 1900 : 2000;
      const month = new Date(`${match[2]} 1, 2000`).getMonth() + 1;
      return `${year}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
    }
    return '';
  }

  function classifyStatementCategory(description, type) {
    const text = description.toLocaleLowerCase('en-US');
    if (type === 'income') {
      if (/salary|payroll|wage/.test(text)) return 'Salary';
      if (/freelance|consult|client/.test(text)) return 'Freelance';
      if (/dividend|interest|mutual fund|investment/.test(text)) return 'Investment';
      if (/gift|cashback|reward/.test(text)) return 'Gift';
      if (/business|merchant settlement/.test(text)) return 'Business';
      return 'Other';
    }
    if (/swiggy|zomato|restaurant|cafe|food|grocery|grocer|supermarket|blinkit|zepto/.test(text)) return 'Food';
    if (/rent|housing|maintenance|property/.test(text)) return 'Housing';
    if (/uber|ola|rapido|metro|fuel|petrol|parking|irctc|railway|bus/.test(text)) return 'Transport';
    if (/amazon|flipkart|myntra|retail|shopping|store/.test(text)) return 'Shopping';
    if (/electricity|water bill|internet|broadband|mobile recharge|utility|gas bill/.test(text)) return 'Bills';
    if (/pharmacy|hospital|clinic|medical|health/.test(text)) return 'Health';
    if (/netflix|spotify|cinema|movie|bookmyshow|prime video/.test(text)) return 'Entertainment';
    if (/school|college|tuition|course|education/.test(text)) return 'Education';
    if (/salon|personal care|grooming/.test(text)) return 'Personal care';
    return 'Other';
  }

  function parseStatementLines(lines) {
    const output = [];
    const datePattern = /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{1,2}[\s-][A-Za-z]{3,}[\s-]\d{2,4})\s+(.+)$/;
    const amountPattern = /(?:₹\s*|INR\s*)?-?\d[\d,]*(?:\.\d{1,2})?\s*(?:CR|DR)?/gi;
    lines.forEach((line) => {
      const matched = line.trim().match(datePattern);
      if (!matched || /opening balance|closing balance|brought forward|carried forward/i.test(line)) return;
      const date = parseStatementDate(matched[1]);
      if (!validDate(date)) return;
      const remainder = matched[2];
      const candidates = [...remainder.matchAll(amountPattern)].filter((match) => match[0].trim() && /\d/.test(match[0]));
      const monetary = candidates.filter((match) => /₹|INR|[,.]\d{2}|\d,\d{3}/i.test(match[0]) || /\b(?:CR|DR)\b/i.test(match[0]));
      const directed = monetary.filter((match) => /\b(?:CR|DR)\b/i.test(match[0]));
      if (directed.length > 1 || (!directed.length && monetary.length !== 1)) return;
      const chosen = directed[0] || monetary[0];
      if (!chosen) return;
      const amount = Number(chosen[0].replace(/[₹,\s]|INR|CR|DR|\(|\)/gi, '').replace(/^-/, ''));
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return;
      let description = remainder.slice(0, chosen.index).replace(/\s+/g, ' ').trim();
      if (!description) description = remainder.replace(chosen[0], '').replace(/\s+/g, ' ').trim();
      description = description.replace(/\b\d{8,}\b/g, '[reference]').replace(/[|•]+/g, ' ').trim().slice(0, 70);
      if (!description || /balance brought forward|statement summary/i.test(description)) return;
      const type = /\bCR\b/i.test(chosen[0]) || /\b(?:credit|credited|salary|refund|cashback|deposit|interest received)\b/i.test(description) ? 'income' : 'expense';
      output.push({ id: uid(), description, amount: Math.round(amount * 100) / 100, date, type, category: classifyStatementCategory(description, type), selected: true, source: 'statement' });
    });
    return output;
  }

  function renderStatementPreview(fileName) {
    const tbody = $('#statement-preview-rows');
    tbody.replaceChildren();
    $('#statement-review').hidden = false;
    $('#statement-empty').hidden = statementRows.length > 0;
    $('.statement-table-panel .table-scroll').hidden = statementRows.length === 0;
    setText('#statement-summary', `${fileName} · ${statementRows.length} rows · categories are suggestions; review each one.`);
    statementRows.forEach((row, index) => {
      const tableRow = document.createElement('tr');
      const checkCell = document.createElement('td');
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = row.selected; checkbox.setAttribute('aria-label', `Import ${row.description}`); checkbox.addEventListener('change', () => { row.selected = checkbox.checked; updateImportButton(); }); checkCell.append(checkbox);
      const descriptionCell = document.createElement('td'); const descriptionInput = document.createElement('input'); descriptionInput.className = 'statement-input statement-description'; descriptionInput.value = row.description; descriptionInput.maxLength = 70; descriptionInput.setAttribute('aria-label', `Description for row ${index + 1}`); descriptionInput.addEventListener('input', () => { row.description = descriptionInput.value; row.category = classifyStatementCategory(row.description, row.type); categorySelect.value = row.category; }); descriptionCell.append(descriptionInput);
      const dateCell = document.createElement('td'); const dateInput = document.createElement('input'); dateInput.className = 'statement-input statement-date'; dateInput.type = 'date'; dateInput.value = row.date; dateInput.setAttribute('aria-label', `Date for row ${index + 1}`); dateInput.addEventListener('change', () => { row.date = dateInput.value; }); dateCell.append(dateInput);
      const typeCell = document.createElement('td'); const typeSelect = document.createElement('select'); typeSelect.className = 'statement-select'; ['expense', 'income'].forEach((type) => addOption(typeSelect, type, type === 'income' ? 'Credit' : 'Debit')); typeSelect.value = row.type;
      const categoryCell = document.createElement('td'); const categorySelect = document.createElement('select'); categorySelect.className = 'statement-select'; typeSelect.addEventListener('change', () => { row.type = typeSelect.value; fillCategorySelect(categorySelect, CATEGORIES[row.type], classifyStatementCategory(row.description, row.type)); row.category = categorySelect.value; }); fillCategorySelect(categorySelect, CATEGORIES[row.type], row.category); categorySelect.addEventListener('change', () => { row.category = categorySelect.value; }); typeCell.append(typeSelect); categoryCell.append(categorySelect);
      const amountCell = document.createElement('td'); amountCell.className = 'amount-cell'; const amountInput = document.createElement('input'); amountInput.className = 'statement-input statement-amount'; amountInput.type = 'number'; amountInput.min = '0.01'; amountInput.max = String(MAX_AMOUNT); amountInput.step = '0.01'; amountInput.value = row.amount.toFixed(2); amountInput.inputMode = 'decimal'; amountInput.setAttribute('aria-label', `Amount for row ${index + 1}`); amountInput.addEventListener('input', () => { row.amount = Number(amountInput.value); }); amountCell.append(amountInput);
      tableRow.append(checkCell, descriptionCell, dateCell, typeCell, categoryCell, amountCell); tbody.append(tableRow);
    });
    $('#select-all-statement-rows').checked = statementRows.length > 0;
    updateImportButton();
  }

  function updateImportButton() {
    $('#import-statement-rows').disabled = !statementRows.some((row) => row.selected);
  }

  function toggleAllStatementRows() {
    const selected = $('#select-all-statement-rows').checked;
    statementRows.forEach((row) => { row.selected = selected; });
    $$('#statement-preview-rows input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = selected; });
    updateImportButton();
  }

  function clearStatementReview() {
    statementRows = [];
    $('#statement-review').hidden = true;
    $('#statement-status').hidden = true;
    $('#statement-file').value = '';
  }

  function showStatementStatus(message, isError) {
    const status = $('#statement-status');
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  function transactionFingerprint(transaction) {
    return [transaction.date, transaction.type, Number(transaction.amount).toFixed(2), transaction.description.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')].join('|');
  }

  function importStatementRows() {
    const selected = statementRows.filter((row) => row.selected);
    if (!selected.length) { showStatementStatus('Select at least one transaction row to import.', true); return; }
    const seen = new Set(state.transactions.map(transactionFingerprint));
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    selected.forEach((row) => {
      const description = row.description.trim().slice(0, 70);
      const amount = Number(row.amount);
      if (!description || !parseAmount(amount) || !validDate(row.date) || row.date > todayISO || !CATEGORIES[row.type]?.includes(row.category)) { invalid += 1; return; }
      const record = { id: uid(), description, amount: Math.round(amount * 100) / 100, date: row.date, type: row.type, category: row.category };
      const fingerprint = transactionFingerprint(record);
      if (seen.has(fingerprint)) { duplicates += 1; return; }
      seen.add(fingerprint);
      state.transactions.push(record);
      imported += 1;
    });
    if (imported) {
      state.demo = state.transactions.some((item) => item.sample);
      persistAndRender();
    }
    showStatementStatus(`${imported} imported · ${duplicates} duplicates skipped · ${invalid} invalid rows skipped.`, invalid > 0);
    statementRows = statementRows.filter((row) => !row.selected);
    renderStatementPreview('Import review');
  }

  function updateProfileLabel() {
    const label = $('.profile-name');
    if (!label) return;
    const title = $('strong', label);
    const detail = $('small', label);
    title.textContent = activeEmail || 'Demo workspace';
    detail.textContent = storageWarning ? 'Storage needs attention' : state.transactions.some((item) => item.sample) ? 'Sample data included' : 'Private local workspace';
    $('.avatar').textContent = (activeEmail || 'D').slice(0, 1).toLocaleUpperCase('en-US');
  }

  function renderDashboard() {
    const monthly = monthTransactions();
    const totals = monthly.reduce((sum, record) => {
      sum[record.type] += record.amount;
      sum[`${record.type}Count`] += 1;
      return sum;
    }, { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 });
    const flow = totals.income - totals.expense;
    const rate = totals.income > 0 ? (flow / totals.income) * 100 : 0;
    setText('#monthly-income', formatMoney(totals.income));
    setText('#monthly-expenses', formatMoney(totals.expense));
    setText('#cash-flow', formatMoney(flow));
    setText('#savings-rate', `${Math.round(rate)}%`);
    setText('#income-count', `${totals.incomeCount} ${totals.incomeCount === 1 ? 'entry' : 'entries'}`);
    setText('#expense-count', `${totals.expenseCount} ${totals.expenseCount === 1 ? 'entry' : 'entries'}`);
    setText('#cash-tag', formatMonth(selectedMonth));
    const rateTag = $('#rate-tag');
    rateTag.textContent = rate < 0 ? 'Spending exceeds income' : rate < 10 && totals.income > 0 ? 'Room to build' : 'Positive flow';
    rateTag.classList.toggle('coral', rate < 0);
    $('#cash-flow').classList.toggle('negative-value', flow < 0);
    const recent = [...monthly].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4);
    renderRecentTransactions(recent);
    renderBudgetPreview(monthly);
    renderCategoryBreakdown(monthly);
    renderDashboardInsight(totals, flow, rate, monthly);
  }

  function createTransactionLine(transaction) {
    const row = document.createElement('div');
    row.className = 'transaction-item';
    const icon = document.createElement('span');
    icon.className = `transaction-icon${transaction.type === 'income' ? ' income' : ''}`;
    icon.textContent = CATEGORY_ICONS[transaction.category] || '·';
    const copy = document.createElement('div');
    copy.className = 'transaction-copy';
    const title = document.createElement('strong');
    title.textContent = transaction.description;
    const detail = document.createElement('span');
    detail.textContent = `${transaction.category} · ${formatDate(transaction.date)}`;
    copy.append(title, detail);
    const amount = document.createElement('span');
    amount.className = `transaction-amount${transaction.type === 'income' ? ' income' : ''}`;
    amount.textContent = `${transaction.type === 'income' ? '+' : '−'}${formatMoney(transaction.amount)}`;
    row.append(icon, copy, amount);
    return row;
  }

  function renderRecentTransactions(records) {
    const container = $('#recent-transactions');
    container.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('div');
      empty.className = 'budget-preview-empty';
      empty.append('No transactions in this month. ');
      const add = document.createElement('button');
      add.className = 'empty-action'; add.dataset.openDialog = 'transaction-dialog'; add.textContent = 'Add one';
      empty.append(add); container.append(empty); return;
    }
    records.forEach((record) => container.append(createTransactionLine(record)));
  }

  function renderBudgetPreview(monthly = monthTransactions()) {
    const container = $('#budget-preview');
    container.replaceChildren();
    const budgets = state.budgets.slice(0, 4);
    if (!budgets.length) {
      const empty = document.createElement('div'); empty.className = 'budget-preview-empty';
      empty.append('No budgets yet. ');
      const add = document.createElement('button'); add.className = 'empty-action'; add.dataset.navigates = 'budgets'; add.dataset.navigate = 'budgets'; add.textContent = 'Create a plan';
      empty.append(add); container.append(empty); return;
    }
    budgets.forEach((budget) => {
      const spent = monthly.filter((record) => record.type === 'expense' && record.category === budget.category).reduce((sum, record) => sum + record.amount, 0);
      const line = document.createElement('div');
      const top = document.createElement('div'); top.className = 'budget-line-top';
      const label = document.createElement('strong'); label.textContent = budget.category;
      const value = document.createElement('span'); value.textContent = `${formatMoney(spent)} / ${formatMoney(budget.amount)}`;
      top.append(label, value);
      const track = document.createElement('div'); track.className = 'progress-track';
      const fill = document.createElement('div'); fill.className = `progress-fill${spent > budget.amount ? ' over' : spent >= budget.amount * 0.8 ? ' warn' : ''}`; fill.style.width = `${Math.min((spent / budget.amount) * 100, 100)}%`;
      track.append(fill); line.append(top, track); container.append(line);
    });
  }

  function renderCategoryBreakdown(monthly = monthTransactions()) {
    const totals = monthly.filter((record) => record.type === 'expense').reduce((map, record) => {
      map.set(record.category, (map.get(record.category) || 0) + record.amount);
      return map;
    }, new Map());
    const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const total = ordered.reduce((sum, [, amount]) => sum + amount, 0);
    setText('#category-total', formatMoney(total));
    const container = $('#category-legend'); container.replaceChildren();
    ordered.slice(0, 4).forEach(([category, amount], index) => {
      const row = document.createElement('div'); row.className = 'category-legend-item';
      const dot = document.createElement('i'); dot.className = 'legend-dot'; dot.style.background = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      const label = document.createElement('span'); label.textContent = category;
      const value = document.createElement('strong'); value.textContent = formatMoney(amount);
      row.append(dot, label, value); container.append(row);
    });
    if (!ordered.length) { const empty = document.createElement('span'); empty.className = 'chart-empty'; empty.textContent = 'No expenses this month'; container.append(empty); }
  }

  function renderDashboardInsight(totals, flow, rate, monthly = monthTransactions()) {
    let message;
    const overspent = state.budgets.map((budget) => ({ ...budget, spent: monthly.filter((item) => item.type === 'expense' && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0) })).find((budget) => budget.spent > budget.amount);
    if (overspent) message = `${overspent.category} is ${formatMoney(overspent.spent - overspent.amount)} over its ${formatMoney(overspent.amount)} monthly budget. A quick check-in could help keep the rest of the month balanced.`;
    else if (!totals.income && !totals.expense) message = 'There are no records for this month yet. Add transactions to see a useful monthly snapshot.';
    else if (flow < 0) message = `Expenses are ${formatMoney(Math.abs(flow))} above recorded income this month. Review your largest categories in Analytics.`;
    else if (rate >= 20) message = `You have kept ${Math.round(rate)}% of recorded income as positive cash flow so far this month. Nice steady progress.`;
    else if (totals.expense > 0) message = `Your largest spending category this month is ${categoryTotals()[0]?.[0] || 'spending'}. Small, intentional adjustments can add up.`;
    else message = 'Add an expense or a budget to get a more specific monthly observation.';
    setText('#dashboard-insight', message);
  }

  function renderTransactions() {
    const search = $('#transaction-search').value.trim().toLocaleLowerCase();
    const type = $('#type-filter').value;
    const category = $('#category-filter').value;
    const sort = $('#sort-transactions').value;
    const categories = [...new Set(state.transactions.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
    const categorySelect = $('#category-filter');
    const previousCategory = categorySelect.value;
    categorySelect.replaceChildren(); addOption(categorySelect, 'all', 'All categories');
    categories.forEach((item) => addOption(categorySelect, item, item));
    categorySelect.value = categories.includes(previousCategory) ? previousCategory : 'all';
    let results = state.transactions.filter((record) => {
      const matchesSearch = !search || `${record.description} ${record.category} ${record.type}`.toLocaleLowerCase().includes(search);
      return matchesSearch && (type === 'all' || record.type === type) && (categorySelect.value === 'all' || record.category === categorySelect.value);
    });
    if (sort === 'date-asc') results.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === 'amount-desc') results.sort((a, b) => b.amount - a.amount);
    else if (sort === 'amount-asc') results.sort((a, b) => a.amount - b.amount);
    else results.sort((a, b) => b.date.localeCompare(a.date));
    setText('#transaction-result-count', `${results.length} ${results.length === 1 ? 'transaction' : 'transactions'}`);
    const body = $('#transactions-table'); body.replaceChildren();
    results.forEach((record) => {
      const row = document.createElement('tr');
      const descriptionCell = document.createElement('td');
      const description = document.createElement('div'); description.className = 'table-desc';
      const icon = document.createElement('span'); icon.className = `transaction-icon${record.type === 'income' ? ' income' : ''}`; icon.textContent = CATEGORY_ICONS[record.category] || '·';
      const title = document.createElement('strong'); title.textContent = record.description;
      description.append(icon, title); descriptionCell.append(description);
      const categoryCell = document.createElement('td'); categoryCell.className = 'category-cell'; categoryCell.textContent = record.category;
      const dateCell = document.createElement('td'); dateCell.textContent = formatDate(record.date, true);
      const typeCell = document.createElement('td'); const pill = document.createElement('span'); pill.className = `type-pill${record.type === 'income' ? ' income' : ''}`; pill.textContent = record.type; typeCell.append(pill);
      const amountCell = document.createElement('td'); amountCell.className = `amount-cell${record.type === 'income' ? ' income' : ''}`; amountCell.textContent = `${record.type === 'income' ? '+' : '−'}${formatMoney(record.amount)}`;
      const actionCell = document.createElement('td'); const actions = document.createElement('div'); actions.className = 'row-actions';
      const edit = makeActionButton('edit-transaction', record.id, 'Edit transaction', '✎');
      const remove = makeActionButton('delete-transaction', record.id, 'Delete transaction', '×', 'delete');
      actions.append(edit, remove); actionCell.append(actions);
      row.append(descriptionCell, categoryCell, dateCell, typeCell, amountCell, actionCell); body.append(row);
    });
    $('#transactions-empty').hidden = results.length > 0;
    $('.table-scroll').hidden = results.length === 0;
  }

  function makeActionButton(action, id, label, icon, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `row-action ${extraClass}`.trim(); button.dataset.action = action; button.dataset.id = id; button.setAttribute('aria-label', label); button.title = label; button.textContent = icon;
    return button;
  }

  function exportCSV() {
    if (!state.transactions.length) { showToast('There are no transactions to export.', true); return; }
    const rows = [['Date', 'Description', 'Type', 'Category', 'Amount (INR)', 'Sample data']];
    [...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach((item) => rows.push([item.date, item.description, item.type, item.category, item.amount.toFixed(2), item.sample ? 'Yes' : 'No']));
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCSV).join(',')).join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `moneywise-transactions-${todayISO}.csv`; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast(`${state.transactions.length} transactions exported.`);
  }

  function renderAnalytics() {
    const totals = categoryTotals();
    const total = totals.reduce((sum, [, amount]) => sum + amount, 0);
    setText('#analytics-category-total', formatMoney(total));
    const list = $('#analytics-category-list'); list.replaceChildren();
    const maxAmount = totals[0]?.[1] || 1;
    totals.slice(0, 6).forEach(([category, amount], index) => {
      const row = document.createElement('div'); row.className = 'rank-row';
      const label = document.createElement('span'); label.textContent = category;
      const track = document.createElement('div'); track.className = 'progress-track';
      const fill = document.createElement('div'); fill.className = 'progress-fill'; fill.style.width = `${(amount / maxAmount) * 100}%`; fill.style.background = CATEGORY_COLORS[index % CATEGORY_COLORS.length]; track.append(fill);
      const value = document.createElement('strong'); value.textContent = formatMoney(amount);
      row.append(label, track, value); list.append(row);
    });
    if (!totals.length) { const empty = document.createElement('div'); empty.className = 'chart-empty'; empty.textContent = 'No expense records for this month.'; list.append(empty); }
    const largest = $('#largest-categories'); largest.replaceChildren();
    totals.slice(0, 4).forEach(([category, amount], index) => {
      const item = document.createElement('div'); item.className = 'largest-item';
      const rank = document.createElement('span'); rank.className = 'largest-rank'; rank.textContent = String(index + 1).padStart(2, '0');
      const copy = document.createElement('div'); const name = document.createElement('strong'); name.textContent = category; const share = document.createElement('span'); share.textContent = `${total ? Math.round(amount / total * 100) : 0}% of monthly expenses`; copy.append(name, share);
      const value = document.createElement('strong'); value.className = 'largest-value'; value.textContent = formatMoney(amount);
      item.append(rank, copy, value); largest.append(item);
    });
    if (!totals.length) { const empty = document.createElement('div'); empty.className = 'budget-empty'; empty.textContent = 'Your expense rankings will appear here.'; largest.append(empty); }
  }

  function renderBudgets() {
    const monthly = monthTransactions();
    const totals = monthTotals();
    const spent = totals.expense;
    const planned = state.budgets.reduce((sum, item) => sum + item.amount, 0);
    const remaining = planned - state.budgets.reduce((sum, budget) => sum + monthly.filter((item) => item.type === 'expense' && item.category === budget.category).reduce((sub, item) => sub + item.amount, 0), 0);
    const overspentCount = state.budgets.filter((budget) => monthly.filter((item) => item.type === 'expense' && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0) > budget.amount).length;
    const summary = $('#budget-summary'); summary.replaceChildren();
    [[`TOTAL PLANNED · ${formatMonth(selectedMonth)}`, formatMoney(planned)], ['TOTAL EXPENSES', formatMoney(spent)], [overspentCount ? `${overspentCount} CATEGORY OVER LIMIT` : 'BUDGET REMAINING', formatMoney(remaining)]].forEach(([label, value], index) => {
      const box = document.createElement('div'); box.className = 'summary-box'; const caption = document.createElement('span'); caption.textContent = label; const amount = document.createElement('strong'); amount.textContent = value; if (index === 2 && remaining < 0) amount.classList.add('negative'); box.append(caption, amount); summary.append(box);
    });
    const grid = $('#budget-grid'); grid.replaceChildren();
    if (!state.budgets.length) { const empty = document.createElement('div'); empty.className = 'budget-empty'; const title = document.createElement('strong'); title.textContent = 'Start with one category'; const copy = document.createElement('p'); copy.textContent = 'Choose a monthly amount for a category you want to keep an eye on.'; const button = document.createElement('button'); button.className = 'button button-primary button-small'; button.dataset.openDialog = 'budget-dialog'; button.textContent = '＋ Create a budget'; empty.append(title, copy, button); grid.append(empty); return; }
    state.budgets.forEach((budget) => {
      const actual = monthly.filter((item) => item.type === 'expense' && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0);
      const percent = actual / budget.amount * 100; const remainingAmount = budget.amount - actual;
      const card = document.createElement('article'); card.className = 'budget-card';
      const head = document.createElement('div'); head.className = 'budget-card-head';
      const icon = document.createElement('span'); icon.className = 'budget-category-icon'; icon.textContent = CATEGORY_ICONS[budget.category] || '·';
      const title = document.createElement('div'); title.className = 'budget-card-title'; const name = document.createElement('strong'); name.textContent = budget.category; const sub = document.createElement('span'); sub.textContent = `Monthly limit · ${formatMonth(selectedMonth)}`; title.append(name, sub);
      const actions = document.createElement('div'); actions.className = 'card-menu'; actions.append(makeActionButton('edit-budget', budget.id, 'Edit budget', '✎'), makeActionButton('delete-budget', budget.id, 'Delete budget', '×', 'delete'));
      head.append(icon, title, actions);
      const amountLine = document.createElement('div'); amountLine.className = 'budget-amount-line'; const actualLabel = document.createElement('strong'); actualLabel.textContent = formatMoney(actual); const limit = document.createElement('span'); limit.textContent = `of ${formatMoney(budget.amount)}`; amountLine.append(actualLabel, limit);
      const track = document.createElement('div'); track.className = 'progress-track'; const fill = document.createElement('div'); fill.className = `progress-fill${percent > 100 ? ' over' : percent >= 80 ? ' warn' : ''}`; fill.style.width = `${Math.min(percent, 100)}%`; track.append(fill);
      const bottom = document.createElement('div'); bottom.className = 'budget-bottom'; const used = document.createElement('span'); used.textContent = `${Math.round(percent)}% used`; const rem = document.createElement('span'); rem.className = remainingAmount < 0 ? 'overspend' : ''; rem.textContent = remainingAmount < 0 ? `${formatMoney(Math.abs(remainingAmount))} over budget` : `${formatMoney(remainingAmount)} remaining`; bottom.append(used, rem);
      card.append(head, amountLine, track, bottom); grid.append(card);
    });
  }

  function renderGoals() {
    const saved = state.goals.reduce((sum, goal) => sum + goalSaved(goal), 0);
    setText('#total-goal-saved', formatMoney(saved));
    setText('#goal-summary-text', state.goals.length ? `${state.goals.length} ${state.goals.length === 1 ? 'goal' : 'goals'} in progress. Every contribution is recorded once.` : 'Add a goal to give your savings a direction.');
    const grid = $('#goals-grid'); grid.replaceChildren();
    if (!state.goals.length) { const empty = document.createElement('div'); empty.className = 'goals-empty'; const title = document.createElement('strong'); title.textContent = 'Give a future plan a name'; const copy = document.createElement('p'); copy.textContent = 'Create a savings goal and log contributions as you make them.'; const button = document.createElement('button'); button.className = 'button button-primary button-small'; button.dataset.openDialog = 'goal-dialog'; button.textContent = '＋ Create a goal'; empty.append(title, copy, button); grid.append(empty); return; }
    state.goals.forEach((goal) => {
      const current = goalSaved(goal); const percent = current / goal.target * 100; const remaining = Math.max(0, goal.target - current); const isOverdue = goal.deadline < todayISO && current < goal.target;
      const card = document.createElement('article'); card.className = 'goal-card';
      const head = document.createElement('div'); head.className = 'goal-card-head'; const icon = document.createElement('span'); icon.className = 'goal-category-icon'; icon.textContent = '◇';
      const title = document.createElement('div'); title.className = 'goal-card-title'; const name = document.createElement('strong'); name.textContent = goal.name; const sub = document.createElement('span'); sub.textContent = `${formatMoney(current)} saved of ${formatMoney(goal.target)}`; title.append(name, sub);
      const actions = document.createElement('div'); actions.className = 'card-menu'; actions.append(makeActionButton('edit-goal', goal.id, 'Edit savings goal', '✎'), makeActionButton('delete-goal', goal.id, 'Delete savings goal', '×', 'delete'));
      head.append(icon, title, actions);
      const track = document.createElement('div'); track.className = 'progress-track'; const fill = document.createElement('div'); fill.className = 'progress-fill'; fill.style.width = `${Math.min(percent, 100)}%`; track.append(fill);
      const progress = document.createElement('div'); progress.className = 'goal-progress-line'; const progressText = document.createElement('span'); progressText.textContent = `${Math.min(Math.round(percent), 100)}% complete`; const left = document.createElement('strong'); left.textContent = current >= goal.target ? 'Goal reached' : `${formatMoney(remaining)} to go`; progress.append(progressText, left);
      const date = document.createElement('div'); date.className = `goal-date${isOverdue ? ' overdue' : ''}`; date.textContent = isOverdue ? `Deadline passed · ${formatDate(goal.deadline, true)}` : `Target date · ${formatDate(goal.deadline, true)}`;
      const actionsBottom = document.createElement('div'); actionsBottom.className = 'goal-actions'; const contributionCount = document.createElement('span'); contributionCount.className = 'goal-date'; contributionCount.style.margin = '0'; contributionCount.style.padding = '0'; contributionCount.style.border = '0'; contributionCount.textContent = `${goal.contributions.length} ${goal.contributions.length === 1 ? 'contribution' : 'contributions'}`;
      const contribute = document.createElement('button'); contribute.className = 'button button-outline'; contribute.type = 'button'; contribute.dataset.action = 'contribute'; contribute.dataset.id = goal.id; contribute.disabled = current >= goal.target; contribute.textContent = current >= goal.target ? 'Complete' : '＋ Add money';
      actionsBottom.append(contributionCount, contribute); card.append(head, track, progress, date, actionsBottom); grid.append(card);
    });
  }

  function renderCoach() {
    const monthly = monthTransactions();
    const totals = monthTotals(); const flow = totals.income - totals.expense; const insights = [];
    state.budgets.forEach((budget) => {
      const spent = monthly.filter((item) => item.type === 'expense' && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0);
      if (spent > budget.amount) insights.push({ warning: true, icon: '!', label: 'BUDGET CHECK', title: `${budget.category} is over its limit`, body: `You recorded <strong>${formatMoney(spent)}</strong> against a <strong>${formatMoney(budget.amount)}</strong> monthly budget, exceeding it by <strong>${formatMoney(spent - budget.amount)}</strong>. Consider reviewing remaining ${budget.category.toLowerCase()} plans.` });
      else if (spent >= budget.amount * 0.8 && spent > 0) insights.push({ warning: false, icon: '↗', label: 'PACE CHECK', title: `${budget.category} is nearing its limit`, body: `You have used ${Math.round(spent / budget.amount * 100)}% of your <strong>${formatMoney(budget.amount)}</strong> ${budget.category.toLowerCase()} budget, with <strong>${formatMoney(budget.amount - spent)}</strong> remaining.` });
    });
    if (totals.income > 0 && flow < 0) insights.push({ warning: true, icon: '−', label: 'CASH FLOW', title: 'Outgoings are ahead this month', body: `Recorded expenses are <strong>${formatMoney(Math.abs(flow))}</strong> above recorded income for ${formatMonth(selectedMonth)}. Check for one-off purchases before changing recurring plans.` });
    else if (totals.income > 0 && flow >= 0) insights.push({ warning: false, icon: '✓', label: 'CASH FLOW', title: 'A positive month so far', body: `You have <strong>${formatMoney(flow)}</strong> between recorded income and expenses this month. This is cash flow, not a bank balance.` });
    const largest = categoryTotals()[0];
    if (largest) insights.push({ warning: false, icon: CATEGORY_ICONS[largest[0]] || '·', label: 'SPENDING PATTERN', title: `${largest[0]} is your largest expense category`, body: `Your ${largest[0].toLowerCase()} records total <strong>${formatMoney(largest[1])}</strong> this month${totals.expense ? `, or ${Math.round(largest[1] / totals.expense * 100)}% of your recorded expenses` : ''}. Compare this with your priorities, not just the category average.` });
    const goalsInProgress = state.goals.filter((goal) => goalSaved(goal) > 0 && goalSaved(goal) < goal.target);
    if (goalsInProgress.length) {
      const nearest = goalsInProgress.sort((a, b) => (a.target - goalSaved(a)) - (b.target - goalSaved(b)))[0];
      insights.push({ warning: false, icon: '◇', label: 'SAVINGS MOMENTUM', title: `${nearest.name} is ${Math.round(goalSaved(nearest) / nearest.target * 100)}% funded`, body: `<strong>${formatMoney(nearest.target - goalSaved(nearest))}</strong> remains to reach this goal by ${formatDate(nearest.deadline, true)}. Contributions are tracked separately from expenses.` });
    }
    if (!insights.length) insights.push({ warning: false, icon: '✳', label: 'A PLACE TO START', title: 'Build a clearer money picture', body: 'Add a few recent transactions and one monthly budget. Money Coach will use those records to offer specific, grounded observations.' });
    setText('#coach-headline', insights.some((item) => item.warning) ? 'A couple of things worth a closer look.' : 'You are building a useful picture.');
    setText('#coach-status', insights.some((item) => item.warning) ? 'REVIEW SUGGESTED' : 'IN YOUR CONTROL');
    const container = $('#coach-insights'); container.replaceChildren();
    insights.slice(0, 6).forEach((insight) => {
      const card = document.createElement('article'); card.className = `coach-card${insight.warning ? ' warning' : ''}`;
      const top = document.createElement('div'); top.className = 'coach-card-top'; const icon = document.createElement('span'); icon.className = 'coach-insight-icon'; icon.textContent = insight.icon; const label = document.createElement('span'); label.textContent = insight.label; top.append(icon, label);
      const title = document.createElement('h3'); title.textContent = insight.title;
      const body = document.createElement('p'); appendCoachBody(body, insight.body);
      card.append(top, title, body); container.append(card);
    });
  }

  function appendCoachBody(container, content) {
    const parts = content.split(/(<strong>.*?<\/strong>)/g);
    parts.forEach((part) => {
      const match = part.match(/^<strong>(.*?)<\/strong>$/);
      if (match) {
        const emphasis = document.createElement('strong');
        emphasis.textContent = match[1];
        container.append(emphasis);
      } else {
        container.append(document.createTextNode(part));
      }
    });
  }

  function sixMonthSeries(key = selectedMonth) {
    return Array.from({ length: 6 }, (_, index) => monthOffset(key, index - 5)).map((month) => {
      const totals = monthTotals(month);
      const [year, monthNumber] = month.split('-').map(Number);
      return { key: month, label: monthFormat.format(new Date(year, monthNumber - 1, 1)), income: totals.income, expense: totals.expense };
    });
  }

  function setupCanvas(canvas) {
    if (!canvas || !canvas.isConnected) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    return { context, width: rect.width, height: rect.height };
  }

  function drawBarChart(canvas, series) {
    const setup = setupCanvas(canvas); if (!setup) return;
    const { context: ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    const left = 46, right = 8, top = 8, bottom = 25;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const maxValue = Math.max(1, ...series.flatMap((item) => [item.income, item.expense]));
    const step = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const axisMax = Math.ceil(maxValue / step) * step || 1;
    ctx.font = '9px "DM Sans", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let index = 0; index <= 3; index += 1) {
      const y = top + plotHeight * index / 3;
      ctx.strokeStyle = '#2b3942'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
      ctx.fillStyle = '#829198'; ctx.fillText(axisMax ? compactMoney.format(axisMax * (1 - index / 3)).replace('₹', '₹') : '₹0', left - 7, y);
    }
    const groupWidth = plotWidth / series.length, barWidth = Math.min(14, groupWidth * .25), gap = 4;
    series.forEach((item, index) => {
      const center = left + groupWidth * (index + .5);
      [[item.income, '#9ce6bd', -barWidth / 2 - gap / 2], [item.expense, '#f08b7c', barWidth / 2 + gap / 2]].forEach(([value, color, shift]) => {
        const barHeight = Math.max(value > 0 ? 1.5 : 0, (value / axisMax) * plotHeight);
        ctx.fillStyle = color; roundedRect(ctx, center + shift - barWidth / 2, top + plotHeight - barHeight, barWidth, barHeight, 3); ctx.fill();
      });
      ctx.fillStyle = '#87969b'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(item.label, center, height - 5);
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath(); ctx.roundRect(x, y, width, height, safeRadius);
  }

  function drawDonut(canvas, data) {
    const setup = setupCanvas(canvas); if (!setup) return;
    const { context: ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    const total = data.reduce((sum, [, amount]) => sum + amount, 0);
    const cx = width / 2, cy = height / 2, radius = Math.min(width, height) * .43, thickness = Math.max(11, radius * .24);
    ctx.lineWidth = thickness; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.strokeStyle = '#2b3942'; ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    if (!total) return;
    let angle = -Math.PI / 2;
    data.forEach(([, amount], index) => {
      const slice = amount / total * Math.PI * 2;
      ctx.beginPath(); ctx.strokeStyle = CATEGORY_COLORS[index % CATEGORY_COLORS.length]; ctx.arc(cx, cy, radius, angle + .018, angle + slice - .018); ctx.stroke(); angle += slice;
    });
  }

  function renderCharts() {
    const series = sixMonthSeries();
    drawBarChart($('#cashflow-chart'), series);
    drawBarChart($('#analytics-flow'), series);
    const categories = categoryTotals();
    drawDonut($('#category-chart'), categories);
    drawDonut($('#analytics-donut'), categories);
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => { window.clearTimeout(timer); timer = window.setTimeout(() => fn(...args), delay); };
  }

  function handleStorageChange(event) {
    if (event.key !== activeStorageKey || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue);
      if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.budgets) || !Array.isArray(parsed.goals)) return;
      state = { version: 1, transactions: parsed.transactions.map(normalizeTransaction).filter(Boolean), budgets: parsed.budgets.map(normalizeBudget).filter(Boolean), goals: parsed.goals.map(normalizeGoal).filter(Boolean), demo: parsed.demo === true };
      setupMonthOptions(); renderAll(); showToast('Workspace updated in another tab.');
    } catch { showToast('Another tab has invalid saved data; this view was not changed.', true); }
  }

  setupStaticControls();
  if (!$('#month-picker').options.length) setupMonthOptions();
  const requestedView = location.hash.slice(1);
  const initialView = requestedView === 'login' ? 'dashboard' : requestedView;
  setView(['dashboard', 'transactions', 'statements', 'analytics', 'budgets', 'goals', 'coach'].includes(initialView) ? initialView : 'dashboard');
  try {
    const savedEmail = sessionStorage.getItem('moneywise-demo-session');
    demoSignedIn = savedEmail === 'demo' || (typeof savedEmail === 'string' && savedEmail.includes('@'));
    if (demoSignedIn) {
      activeEmail = savedEmail === 'demo' ? '' : savedEmail.toLocaleLowerCase('en-US');
      activeStorageKey = activeEmail ? profileStorageKey(activeEmail) : STORAGE_KEY;
      state = loadState(activeStorageKey);
      setupMonthOptions();
      updateProfileLabel();
    }
  } catch { demoSignedIn = false; }
  if (demoSignedIn) {
    $('#login-screen').hidden = true;
    $('.app-shell').hidden = false;
    history.replaceState(null, '', `#${['transactions', 'statements', 'analytics', 'budgets', 'goals', 'coach'].includes(initialView) ? initialView : 'dashboard'}`);
    window.requestAnimationFrame(renderCharts);
  } else {
    $('#login-screen').hidden = false;
    $('.app-shell').hidden = true;
    history.replaceState(null, '', '#login');
  }
  if (storageWarning) showToast('Saved data could not be read or browser storage is unavailable. This session is temporary until storage works.', true);
})();