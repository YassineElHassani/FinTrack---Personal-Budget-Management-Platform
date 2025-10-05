let expenseCategoryChart = null;
let incomeExpenseChart = null;
let budgetChart = null;
let spendingTrendChart = null;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadCategories();
});

async function loadDashboardData() {
    try {
        const transactionResponse = await fetch('/api/transactions-summary?all=true');
        const transactionData = await transactionResponse.json();

        updateFinancialSummary(transactionData);
        
        createExpenseCategoryChart(transactionData.expensesByCategory);
        
        await createIncomeExpenseChart();
        
        updateRecentTransactions(transactionData.recentTransactions);
        
        const savingsResponse = await fetch('/api/savings-summary');
        const savingsData = await savingsResponse.json();
        
        updateSavingsProgress(savingsData);
        
        updateSavingsOverview(savingsData);
        
        await createBudgetChart();
        
        await createSpendingTrendChart();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessages();
    }
}

function updateFinancialSummary(data) {
    document.getElementById('totalIncome').textContent = `$${data.income || '0.00'}`;
    document.getElementById('totalExpenses').textContent = `$${data.expenses || '0.00'}`;
    
    const balance = parseFloat(data.balance || 0);
    const balanceElement = document.getElementById('netBalance');
    
    balanceElement.textContent = `$${Math.abs(balance).toFixed(2)}`;
    if (balance >= 0) {
        balanceElement.classList.add('positive');
        balanceElement.classList.remove('negative');
    } else {
        balanceElement.classList.add('negative');
        balanceElement.classList.remove('positive');
    }
}

function updateSavingsProgress(data) {
    const progressPercent = data.overallProgress || 0;
    document.getElementById('savingsProgress').textContent = `${progressPercent}%`;
    document.getElementById('savingsProgressBar').style.width = `${progressPercent}%`;
}

function createExpenseCategoryChart(expensesByCategory) {
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    
    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
    }
    
    if (!expensesByCategory || Object.keys(expensesByCategory).length === 0) {
        document.getElementById('expenseCategoryChart').style.display = 'none';
        return;
    }
    
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    
    expenseCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `$${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

async function createIncomeExpenseChart() {
    try {
        const response = await fetch('/api/transactions-monthly');
        const monthlyData = await response.json();
        
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        
        if (incomeExpenseChart) {
            incomeExpenseChart.destroy();
        }
        
        const months = monthlyData.map(m => m.month);
        const incomeData = monthlyData.map(m => m.income);
        const expenseData = monthlyData.map(m => m.expenses);
        
        incomeExpenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(0, 196, 140, 0.6)',
                        borderColor: 'rgba(0, 196, 140, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 107, 107, 0.6)',
                        borderColor: 'rgba(255, 107, 107, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                barPercentage: 0.7,
                categoryPercentage: 0.6
            }
        });
    } catch (error) {
        console.error('Error creating income/expense chart:', error);
        document.getElementById('incomeExpenseChart').style.display = 'none';
    }
}

async function createBudgetChart() {
    try {
        const response = await fetch('/api/budget-overview');
        const data = await response.json();
        
        const ctx = document.getElementById('budgetChart').getContext('2d');
        
        if (budgetChart) {
            budgetChart.destroy();
        }
        
        if (!data.budgets || data.budgets.length === 0) {
            document.getElementById('budgetChart').style.display = 'none';
            document.getElementById('budgetSummary').innerHTML = '<div class="no-data">No budgets found for the current month</div>';
            return;
        }
        
        const budgetNames = data.budgets.map(b => b.name);
        const plannedAmounts = data.budgets.map(b => parseFloat(b.total_amount));
        const actualAmounts = data.budgets.map(b => parseFloat(b.spent_amount));
        
        budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: budgetNames,
                datasets: [
                    {
                        label: 'Budget Amount',
                        data: plannedAmounts,
                        backgroundColor: 'rgba(106, 17, 203, 0.5)',
                        borderColor: 'rgba(106, 17, 203, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Spent Amount',
                        data: actualAmounts,
                        backgroundColor: 'rgba(255, 107, 107, 0.6)',
                        borderColor: 'rgba(255, 107, 107, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                barPercentage: 0.7,
                categoryPercentage: 0.6
            }
        });
        
        updateBudgetSummary(data.budgets);
        
    } catch (error) {
        console.error('Error creating budget chart:', error);
        document.getElementById('budgetChart').style.display = 'none';
        document.getElementById('budgetSummary').innerHTML = '<div class="error-data">Error loading budget data</div>';
    }
}

function updateBudgetSummary(budgets) {
    const container = document.getElementById('budgetSummary');
    
    if (!budgets || budgets.length === 0) {
        container.innerHTML = '<div class="no-data">No budget data available</div>';
        return;
    }
    
    const html = budgets.map(budget => {
        const percentageUsed = parseFloat(budget.percentage_used);
        const statusClass = percentageUsed > 100 ? 'exceeded' : 'on-track';
        
        return `
            <div class="budget-item">
                <div class="budget-info">
                    <h4>${budget.name}</h4>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentageUsed, 100)}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span class="${statusClass}">${percentageUsed}%</span>
                        </div>
                    </div>
                </div>
                <div class="budget-amount">
                    <div class="budget-spent">$${budget.spent_amount}</div>
                    <div class="budget-total">of $${budget.total_amount}</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function createSpendingTrendChart() {
    try {
        const response = await fetch('/api/spending-trend');
        const trendData = await response.json();
        
        const ctx = document.getElementById('spendingTrendChart').getContext('2d');
        
        if (spendingTrendChart) {
            spendingTrendChart.destroy();
        }
        
        const months = trendData.map(item => item.month);
        const amounts = trendData.map(item => item.amount);
        
        spendingTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Spending',
                    data: amounts,
                    backgroundColor: 'rgba(255, 154, 0, 0.2)',
                    borderColor: 'rgba(255, 154, 0, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(255, 154, 0, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating spending trend chart:', error);
        document.getElementById('spendingTrendChart').style.display = 'none';
    }
}

function updateRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<div class="no-data">No recent transactions</div>';
        return;
    }
    
    const html = transactions.slice(0, 5).map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-desc">${transaction.description || 'Transaction'}</div>
                <div class="transaction-date">${new Date(transaction.transaction_date).toLocaleDateString()}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updateSavingsOverview(data) {
    const container = document.getElementById('savingsOverview');
    
    if (!data.recentGoals || data.recentGoals.length === 0) {
        container.innerHTML = '<div class="no-data">No savings goals found</div>';
        return;
    }
    
    const html = data.recentGoals.map(goal => {
        const progress = goal.goal_amount > 0 ? (goal.saved_amount / goal.goal_amount) * 100 : 0;
        return `
            <div class="savings-item">
                <div class="savings-info">
                    <h4>${goal.goal_name || 'Unnamed Goal'}</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="savings-progress">${progress.toFixed(1)}% complete</div>
                </div>
                <div class="savings-amount">
                    <div class="savings-saved">$${goal.saved_amount}</div>
                    <div class="savings-goal">of $${goal.goal_amount}</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('quickCategory');
        select.innerHTML = '<option value="">No Category</option>';
        
        categories.forEach(category => {
            select.innerHTML += `<option value="${category.id}">${category.category_name}</option>`;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function showErrorMessages() {
    document.getElementById('totalIncome').textContent = '$0.00';
    document.getElementById('totalExpenses').textContent = '$0.00';
    document.getElementById('netBalance').textContent = '$0.00';
    document.getElementById('savingsProgress').textContent = '0%';
    document.getElementById('recentTransactions').innerHTML = '<div class="error-data">Error loading transaction data</div>';
    document.getElementById('savingsOverview').innerHTML = '<div class="error-data">Error loading savings data</div>';
    document.getElementById('budgetSummary').innerHTML = '<div class="error-data">Error loading budget data</div>';
    document.getElementById('expenseCategoryChart').style.display = 'none';
    document.getElementById('incomeExpenseChart').style.display = 'none';
    document.getElementById('budgetChart').style.display = 'none';
    document.getElementById('spendingTrendChart').style.display = 'none';
}

function openQuickTransaction(type) {
    document.getElementById('quickModalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('quickType').value = type;
    document.getElementById('quickAmount').value = '';
    document.getElementById('quickCategory').value = '';
    document.getElementById('quickDescription').value = '';
    document.getElementById('quickDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('quickSubmitBtn').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('quickTransactionModal').style.display = 'block';
}

function closeQuickModal() {
    document.getElementById('quickTransactionModal').style.display = 'none';
}

document.getElementById('quickTransactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/dashboard/transactions', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            closeQuickModal();
            loadDashboardData();
        } else {
            alert('Error adding transaction');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding transaction');
    });
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('quickTransactionModal');
    if (e.target === modal) {
        closeQuickModal();
    }
});