// ExpenseTracker - frontend demonstration authentication using localStorage.
// IMPORTANT: This is not production authentication. Passwords are stored in plain text.
const USERS_KEY = "expenseTrackerUsers";
const SESSION_KEY = "expenseTrackerSession";
const LEGACY_KEYS = { transactions: "expenseTransactions", expenseCats: "expenseCats", incomeCats: "incomeCats" };
const DEFAULT_EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Others"];
const DEFAULT_INCOME_CATS = ["Salary", "Freelance"];
const defaultTransactions = [
    { id: 1, date: "2026-08-25", description: "Grocery Shopping", category: "Food", type: "expense", amount: 1250 },
    { id: 2, date: "2026-08-25", description: "Salary", category: "Salary", type: "income", amount: 45000 },
    { id: 3, date: "2026-08-24", description: "Electricity Bill", category: "Bills", type: "expense", amount: 1890 },
    { id: 4, date: "2026-08-24", description: "Uber Ride", category: "Transport", type: "expense", amount: 340 },
    { id: 5, date: "2026-08-23", description: "Restaurant", category: "Food", type: "expense", amount: 780 },
    { id: 6, date: "2026-08-22", description: "Shopping", category: "Shopping", type: "expense", amount: 2650 },
    { id: 7, date: "2026-08-20", description: "Freelance Work", category: "Freelance", type: "income", amount: 5000 }
];

let currentUser = null;
let transactions = [];
let expenseCats = [...DEFAULT_EXPENSE_CATS];
let incomeCats = [...DEFAULT_INCOME_CATS];
let currentType = "expense";

const $ = id => document.getElementById(id);
const money = n => "₹" + Math.round(n).toLocaleString("en-IN");
const readJSON = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
};
const getUsers = () => readJSON(USERS_KEY, []);
const userDataKey = (userId) => `expenseTrackerData_${userId}`;

function showAuthMessage(message, type = "error") {
    const box = $("authMessage");
    box.textContent = message;
    box.className = `auth-message ${type}`;
}
function clearAuthMessage() {
    const box = $("authMessage"); box.textContent = ""; box.className = "auth-message";
}
function switchAuthTab(tab) {
    const login = tab === "login";
    $("loginForm").hidden = !login;
    $("signupForm").hidden = login;
    $("loginTab").classList.toggle("active", login);
    $("signupTab").classList.toggle("active", !login);
    $("loginTab").setAttribute("aria-selected", String(login));
    $("signupTab").setAttribute("aria-selected", String(!login));
    clearAuthMessage();
}

function loadUserData(user) {
    const data = readJSON(userDataKey(user.id), null);

    if (data) {
        transactions = Array.isArray(data.transactions) ? data.transactions : [];
        expenseCats = Array.isArray(data.expenseCats) ? data.expenseCats : [...DEFAULT_EXPENSE_CATS];
        incomeCats = Array.isArray(data.incomeCats) ? data.incomeCats : [...DEFAULT_INCOME_CATS];

        // Remove the exact starter demo dataset accidentally copied by an older build.
        const isOnlyStarterData =
            transactions.length === defaultTransactions.length &&
            defaultTransactions.every(sample =>
                transactions.some(tx =>
                    tx.date === sample.date &&
                    tx.description === sample.description &&
                    tx.category === sample.category &&
                    tx.type === sample.type &&
                    Number(tx.amount) === sample.amount
                )
            );

        if (isOnlyStarterData) {
            transactions = [];
            save();
        }
        return;
    }

    // A new account starts empty; never import another account's old shared data.
    transactions = [];
    expenseCats = [...DEFAULT_EXPENSE_CATS];
    incomeCats = [...DEFAULT_INCOME_CATS];
    save();
}

function save() {
    if (!currentUser) return;
    localStorage.setItem(userDataKey(currentUser.id), JSON.stringify({ transactions, expenseCats, incomeCats }));
}

function openApp(user) {
    currentUser = user;
    localStorage.setItem(SESSION_KEY, user.id);
    loadUserData(user);
    $("authScreen").hidden = true;
    $("app").hidden = false;
    $("profileName").textContent = user.name;
    $("profileAvatar").textContent = user.name.trim().charAt(0).toUpperCase() || "U";
    currentType = "expense";
    setType("expense");
    $("date").value = new Date().toISOString().slice(0, 10);
    renderCategories();
    renderDashboard();
    showPage("dashboard");
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    transactions = [];
    expenseCats = [...DEFAULT_EXPENSE_CATS];
    incomeCats = [...DEFAULT_INCOME_CATS];
    $("app").hidden = true;
    $("authScreen").hidden = false;
    $("loginForm").reset();
    $("signupForm").reset();
    switchAuthTab("login");
}

$("loginTab").addEventListener("click", () => switchAuthTab("login"));
$("signupTab").addEventListener("click", () => switchAuthTab("signup"));
$("showSignup").addEventListener("click", () => switchAuthTab("signup"));
$("showLogin").addEventListener("click", () => switchAuthTab("login"));
$("logoutBtn").addEventListener("click", logout);

$("signupForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("signupName").value.trim();
    const email = $("signupEmail").value.trim().toLowerCase();
    const password = $("signupPassword").value;
    const confirmPassword = $("confirmPassword").value;
    if (name.length < 2) return showAuthMessage("Please enter a name with at least 2 characters.");
    if (password.length < 6) return showAuthMessage("Password must contain at least 6 characters.");
    if (password !== confirmPassword) return showAuthMessage("Passwords do not match.");
    const users = getUsers();
    if (users.some(user => user.email === email)) return showAuthMessage("An account with this email already exists. Please log in.");
    const user = { id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, email, password, createdAt: new Date().toISOString() };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    showAuthMessage("Your account has been created. Opening your dashboard...", "success");
    openApp(user);
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    const users = getUsers();

    // A user must register before logging in for the first time.
    if (users.length === 0) {
        showAuthMessage("No account exists yet. Select the Sign Up tab, create an account, and then log in.");
        return;
    }

    const user = users.find(item => item.email === email && item.password === password);
    if (!user) return showAuthMessage("Email or password is incorrect. Check your details or create an account.");
    $("loginForm").reset();
    openApp(user);
});

function showPage(page) {
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active-page"));
    $(page).classList.add("active-page");
    document.querySelectorAll(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.page === page));
    const titles = { dashboard: ["Dashboard", "Overview of your finances"], add: ["Add Transaction", "Add income or expense"], transactions: ["Transactions", "All your transactions"], categories: ["Categories", "Manage your categories"], reports: ["Reports", "Visualize your spending"] };
    $("pageTitle").textContent = titles[page][0];
    $("pageSubtitle").textContent = titles[page][1];
    if (page === "transactions") renderTransactions();
    if (page === "categories") renderCategories();
}
document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => showPage(button.dataset.page)));

function setType(type) {
    currentType = type;
    $("expenseTab").classList.toggle("selected", type === "expense");
    $("incomeTab").classList.toggle("selected", type === "income");
    populateCategories();
}
function populateCategories() {
    const cats = currentType === "expense" ? expenseCats : incomeCats;
    $("category").innerHTML = cats.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("");
}
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function totals() {
    const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const now = new Date();
    const monthTransactions = transactions.filter(t => {
        const d = new Date(`${t.date}T00:00:00`);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIncome = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const monthExpense = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense, monthlySavings: monthIncome - monthExpense };
}
function categoryTotals() {
    const output = {};
    transactions.filter(t => t.type === "expense").forEach(t => output[t.category] = (output[t.category] || 0) + Number(t.amount));
    return output;
}
function renderLegend(id) {
    const data = categoryTotals();
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, item) => sum + item[1], 0);
    const colors = ["#3261df", "#ffbd3d", "#4ac477", "#f04455", "#8b3fd1", "#29a7c9"];
    $(id).innerHTML = entries.map(([name, amount], index) => `<div class="legend-row"><span><i class="dot" style="background:${colors[index % colors.length]}"></i>${escapeHTML(name)}</span><span>${total ? Math.round(amount / total * 100) : 0}% &nbsp; ${money(amount)}</span></div>`).join("") || '<p class="muted-note">Add expenses to see your breakdown.</p>';
    const gradient = total ? entries.reduce((state, item, index) => {
        const start = state.position;
        const end = start + item[1] / total * 100;
        state.parts.push(`${colors[index % colors.length]} ${start}% ${end}%`);
        state.position = end;
        return state;
    }, { position: 0, parts: [] }).parts.join(", ") : "#e8edf5 0% 100%";
    const donut = id === "legend" ? $("dashboardDonut") : $("reportDonutChart");
    donut.style.background = `conic-gradient(${gradient})`;
}
function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function renderRecent() {
    const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    $("recent").innerHTML = recent.map(t => `<div class="tx"><div class="tx-icon">${t.type === "income" ? "▣" : "▤"}</div><div class="tx-main"><b>${escapeHTML(t.description)}</b><small>${escapeHTML(t.category)} · ${formatDate(t.date)}</small></div><span class="amount ${t.type === "income" ? "inc" : "exp"}">${t.type === "income" ? "+" : "-"} ${money(t.amount)}</span></div>`).join("") || '<p class="muted-note">No transactions yet. Add your first transaction.</p>';
}
function renderDashboard() {
    const result = totals();
    $("balance").textContent = money(result.balance);
    $("income").textContent = money(result.income);
    $("expense").textContent = money(result.expense);
    $("savings").textContent = money(result.monthlySavings);
    $("donutTotal").textContent = money(result.expense);
    $("reportIncome").textContent = money(result.income);
    $("reportExpense").textContent = money(result.expense);
    $("reportSavings").textContent = money(result.balance);
    $("reportDonut").textContent = money(result.expense);
    renderLegend("legend");
    renderLegend("reportLegend");
    renderRecent();
}
function renderTransactions() {
    const query = ($("search").value || "").toLowerCase();
    const selectedCategory = $("filterCat").value;
    const selectedType = $("filterType").value;
    const filtered = transactions.filter(t => (t.description + t.category).toLowerCase().includes(query) && (!selectedCategory || t.category === selectedCategory) && (!selectedType || t.type === selectedType)).sort((a, b) => b.date.localeCompare(a.date));
    $("transactionRows").innerHTML = filtered.map(t => `<tr><td>${formatDate(t.date)}</td><td>${escapeHTML(t.description)}</td><td>${escapeHTML(t.category)}</td><td>${t.type[0].toUpperCase() + t.type.slice(1)}</td><td class="amount ${t.type === "income" ? "inc" : "exp"}">${t.type === "income" ? "+" : "-"} ${money(t.amount)}</td><td><button class="delete" onclick="removeTx(${Number(t.id)})" aria-label="Delete transaction">🗑</button></td></tr>`).join("");
    $("emptyTransactions").hidden = filtered.length !== 0;
    $("filterCat").innerHTML = '<option value="">All Categories</option>' + [...new Set([...expenseCats, ...incomeCats])].map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("");
    $("filterCat").value = selectedCategory;
}
function removeTx(id) {
    if (!confirm("Delete this transaction?")) return;
    transactions = transactions.filter(t => t.id !== id);
    save(); renderDashboard(); renderTransactions();
}
function renderCategories() {
    $("expenseCategories").innerHTML = expenseCats.map((category, index) => catRow(category, "expense", index)).join("") || '<p class="muted-note">No expense categories.</p>';
    $("incomeCategories").innerHTML = incomeCats.map((category, index) => catRow(category, "income", index)).join("") || '<p class="muted-note">No income categories.</p>';
}
function catRow(category, type, index) {
    return `<div class="category-row"><span>${escapeHTML(category)}</span><div class="cat-actions"><button onclick="renameCategory('${type}',${index})" aria-label="Rename category">✎</button><button onclick="deleteCategory('${type}',${index})" aria-label="Delete category">×</button></div></div>`;
}
function addCategory(type) {
    const name = prompt("Category name:");
    if (!name?.trim()) return;
    const array = type === "expense" ? expenseCats : incomeCats;
    if (array.some(item => item.toLowerCase() === name.trim().toLowerCase())) return alert("This category already exists.");
    array.push(name.trim()); save(); renderCategories(); populateCategories();
}
function renameCategory(type, index) {
    const array = type === "expense" ? expenseCats : incomeCats;
    const name = prompt("New name:", array[index]);
    if (!name?.trim()) return;
    if (array.some((item, i) => i !== index && item.toLowerCase() === name.trim().toLowerCase())) return alert("This category already exists.");
    const oldName = array[index];
    array[index] = name.trim();
    transactions.forEach(t => { if (t.type === type && t.category === oldName) t.category = name.trim(); });
    save(); renderCategories(); populateCategories(); renderTransactions(); renderDashboard();
}
function deleteCategory(type, index) {
    const array = type === "expense" ? expenseCats : incomeCats;
    if (!confirm("Delete this category? Existing transactions will keep their category name.")) return;
    array.splice(index, 1); save(); renderCategories(); populateCategories();
}

$("transactionForm").addEventListener("submit", event => {
    event.preventDefault();
    const amount = Number($("amount").value);
    if (!Number.isFinite(amount) || amount <= 0) return alert("Enter an amount greater than zero.");
    transactions.push({ id: Date.now(), date: $("date").value, description: $("description").value.trim(), category: $("category").value, type: currentType, amount });
    save(); event.target.reset(); $("date").value = new Date().toISOString().slice(0, 10); renderDashboard(); showPage("transactions");
});

// Restore the previous signed-in demo session when the page is refreshed.
(function initialise() {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const user = getUsers().find(item => item.id === sessionId);
    if (user) openApp(user);
    else {
        localStorage.removeItem(SESSION_KEY);
        $("authScreen").hidden = false;
        $("app").hidden = true;
        switchAuthTab("login");
    }
})();
