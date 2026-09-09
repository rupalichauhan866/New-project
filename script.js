const defaultTransactions = [
    { id: 1, date: "2026-08-25", description: "Grocery Shopping", category: "Food", type: "expense", amount: 1250 },
    { id: 2, date: "2026-08-25", description: "Salary", category: "Salary", type: "income", amount: 45000 },
    { id: 3, date: "2026-08-24", description: "Electricity Bill", category: "Bills", type: "expense", amount: 1890 },
    { id: 4, date: "2026-08-24", description: "Uber Ride", category: "Transport", type: "expense", amount: 340 },
    { id: 5, date: "2026-08-23", description: "Restaurant", category: "Food", type: "expense", amount: 780 },
    { id: 6, date: "2026-08-22", description: "Shopping", category: "Shopping", type: "expense", amount: 2650 },
    { id: 7, date: "2026-08-20", description: "Freelance Work", category: "Freelance", type: "income", amount: 5000 }
];
let transactions = JSON.parse(localStorage.getItem("expenseTransactions")) || defaultTransactions;
let expenseCats = JSON.parse(localStorage.getItem("expenseCats")) || ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Others"];
let incomeCats = JSON.parse(localStorage.getItem("incomeCats")) || ["Salary", "Freelance"];
let currentType = "expense";

const money = n => "₹" + Math.round(n).toLocaleString("en-IN");
function save() { localStorage.setItem("expenseTransactions", JSON.stringify(transactions)); localStorage.setItem("expenseCats", JSON.stringify(expenseCats)); localStorage.setItem("incomeCats", JSON.stringify(incomeCats)) }
function showPage(page) {
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active-page"));
    document.getElementById(page).classList.add("active-page");
    document.querySelectorAll(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.page === page));
    const titles = { dashboard: ["Dashboard", "Overview of your finances"], add: ["Add Transaction", "Add income or expense"], transactions: ["Transactions", "All your transactions"], categories: ["Categories", "Manage your categories"], reports: ["Reports", "Visualize your spending"] };
    document.getElementById("pageTitle").textContent = titles[page][0]; document.getElementById("pageSubtitle").textContent = titles[page][1];
    if (page === "transactions") renderTransactions(); if (page === "categories") renderCategories();
}
document.querySelectorAll(".nav-item").forEach(b => b.onclick = () => showPage(b.dataset.page));
function setType(t) { currentType = t; expenseTab.classList.toggle("selected", t === "expense"); incomeTab.classList.toggle("selected", t === "income"); populateCategories() }
function populateCategories() { const cats = currentType === "expense" ? expenseCats : incomeCats; category.innerHTML = cats.map(c => `<option>${c}</option>`).join("") }
function totals() { let inc = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), exp = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0); return { inc, exp, bal: inc - exp } }
function categoryTotals() { let out = {}; transactions.filter(t => t.type === "expense").forEach(t => out[t.category] = (out[t.category] || 0) + t.amount); return out }
function renderLegend(id) {
    const data = categoryTotals(), total = Object.values(data).reduce((a, b) => a + b, 0) || 1, colors = ["#3261df", "#ffbd3d", "#4ac477", "#f04455", "#8b3fd1", "#29a7c9"];
    document.getElementById(id).innerHTML = Object.entries(data).sort((a, b) => b[1] - a[1]).map((x, i) => `<div class="legend-row"><span><i class="dot" style="background:${colors[i % colors.length]}"></i>${x[0]}</span><span>${Math.round(x[1] / total * 100)}% &nbsp; ${money(x[1])}</span></div>`).join("");
}
function renderRecent() {
    document.getElementById("recent").innerHTML = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(t => `<div class="tx"><div class="tx-icon">${t.type === "income" ? "▣" : "▤"}</div><div class="tx-main"><b>${t.description}</b><small>${t.category} · ${formatDate(t.date)}</small></div><span class="amount ${t.type === "income" ? "inc" : "exp"}">${t.type === "income" ? "+" : "-"} ${money(t.amount)}</span></div>`).join("");
}
function renderDashboard() {
    const t = totals(); balance.textContent = money(t.bal); income.textContent = money(t.inc); expense.textContent = money(t.exp); savings.textContent = money(t.bal); donutTotal.textContent = money(t.exp);
    reportIncome.textContent = money(t.inc); reportExpense.textContent = money(t.exp); reportSavings.textContent = money(t.bal); reportDonut.textContent = money(t.exp);
    renderLegend("legend"); renderLegend("reportLegend"); renderRecent();
}
function formatDate(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
function renderTransactions() {
    const q = (search.value || "").toLowerCase(), fc = filterCat.value, ft = filterType.value;
    transactionRows.innerHTML = transactions.filter(t => (t.description + t.category).toLowerCase().includes(q) && (!fc || t.category === fc) && (!ft || t.type === ft)).sort((a, b) => b.date.localeCompare(a.date)).map(t => `<tr><td>${formatDate(t.date)}</td><td>${t.description}</td><td>${t.category}</td><td>${t.type[0].toUpperCase() + t.type.slice(1)}</td><td class="amount ${t.type === "income" ? "inc" : "exp"}">${t.type === "income" ? "+" : "-"} ${money(t.amount)}</td><td><button class="delete" onclick="removeTx(${t.id})">🗑</button></td></tr>`).join("");
    filterCat.innerHTML = '<option value="">All Categories</option>' + [...new Set([...expenseCats, ...incomeCats])].map(c => `<option>${c}</option>`).join("");
    filterCat.value = fc;
}
function removeTx(id) { transactions = transactions.filter(t => t.id !== id); save(); renderDashboard(); renderTransactions() }
function renderCategories() {
    expenseCategories.innerHTML = expenseCats.map((c, i) => catRow(c, "expense", i)).join("");
    incomeCategories.innerHTML = incomeCats.map((c, i) => catRow(c, "income", i)).join("");
}
function catRow(c, type, i) { return `<div class="category-row"><span>${c}</span><div class="cat-actions"><button onclick="renameCategory('${type}',${i})">✎</button><button onclick="deleteCategory('${type}',${i})">♧</button></div></div>` }
function addCategory(type) { const n = prompt("Category name:"); if (!n?.trim()) return; if (type === "expense") expenseCats.push(n.trim()); else incomeCats.push(n.trim()); save(); renderCategories(); populateCategories() }
function renameCategory(type, i) { const arr = type === "expense" ? expenseCats : incomeCats, n = prompt("New name:", arr[i]); if (n?.trim()) { arr[i] = n.trim(); save(); renderCategories(); populateCategories(); renderTransactions() } }
function deleteCategory(type, i) { const arr = type === "expense" ? expenseCats : incomeCats; if (confirm("Delete this category?")) { arr.splice(i, 1); save(); renderCategories(); populateCategories() } }
transactionForm.onsubmit = e => { e.preventDefault(); transactions.push({ id: Date.now(), date: date.value, description: description.value.trim(), category: category.value, type: currentType, amount: Number(amount.value) }); save(); e.target.reset(); date.value = new Date().toISOString().slice(0, 10); renderDashboard(); showPage("transactions") };
date.value = new Date().toISOString().slice(0, 10); populateCategories(); renderDashboard();
