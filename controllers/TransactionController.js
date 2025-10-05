const { Transaction, Category, User } = require("../models");
const { Op } = require("sequelize");

exports.renderTransactionsPage = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const transactions = await Transaction.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Category,
                    attributes: ['id', 'category_name']
                }
            ],
            order: [['transaction_date', 'DESC']]
        });

        const categories = await Category.findAll({
            where: { user_id: userId }
        });

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const balance = totalIncome - totalExpenses;

        res.render("transactions", {
            username: req.session.user.username,
            email: req.session.user.email,
            title: "Transactions",
            page: "transactions-page",
            transactions: transactions,
            categories: categories,
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            balance: balance.toFixed(2),
            success: req.session.success,
            error: req.session.error
        });

        delete req.session.success;
        delete req.session.error;
    } catch (error) {
        console.error("Error loading transactions page:", error);
        req.session.error = "Error loading transactions data";
        res.redirect("/dashboard");
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const { amount, type, description, category_id, transaction_date } = req.body;
        const userId = req.session.user.id;

        if (!amount || !type || !transaction_date) {
            req.session.error = "Amount, type, and date are required";
            return res.redirect("/dashboard/transactions");
        }

        if (amount <= 0) {
            req.session.error = "Amount must be greater than 0";
            return res.redirect("/dashboard/transactions");
        }

        if (!['income', 'expense'].includes(type)) {
            req.session.error = "Invalid transaction type";
            return res.redirect("/dashboard/transactions");
        }

        if (category_id) {
            const category = await Category.findOne({
                where: {
                    id: category_id,
                    user_id: userId
                }
            });

            if (!category) {
                req.session.error = "Invalid category selected";
                return res.redirect("/dashboard/transactions");
            }
        }

        await Transaction.create({
            user_id: userId,
            amount: parseFloat(amount),
            type: type,
            description: description || null,
            category_id: category_id || null,
            transaction_date: transaction_date
        });

        req.session.success = "Transaction added successfully";
        res.redirect("/dashboard/transactions");
    } catch (error) {
        console.error("Error creating transaction:", error);
        req.session.error = "Error creating transaction";
        res.redirect("/dashboard/transactions");
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const { amount, type, description, category_id, transaction_date } = req.body;
        const userId = req.session.user.id;

        const transaction = await Transaction.findOne({
            where: {
                id: transactionId,
                user_id: userId
            }
        });

        if (!transaction) {
            req.session.error = "Transaction not found";
            return res.redirect("/dashboard/transactions");
        }

        if (!amount || !type || !transaction_date) {
            req.session.error = "Amount, type, and date are required";
            return res.redirect("/dashboard/transactions");
        }

        if (amount <= 0) {
            req.session.error = "Amount must be greater than 0";
            return res.redirect("/dashboard/transactions");
        }

        if (!['income', 'expense'].includes(type)) {
            req.session.error = "Invalid transaction type";
            return res.redirect("/dashboard/transactions");
        }

        if (category_id) {
            const category = await Category.findOne({
                where: {
                    id: category_id,
                    user_id: userId
                }
            });

            if (!category) {
                req.session.error = "Invalid category selected";
                return res.redirect("/dashboard/transactions");
            }
        }

        await transaction.update({
            amount: parseFloat(amount),
            type: type,
            description: description || null,
            category_id: category_id || null,
            transaction_date: transaction_date
        });

        req.session.success = "Transaction updated successfully";
        res.redirect("/dashboard/transactions");
    } catch (error) {
        console.error("Error updating transaction:", error);
        req.session.error = "Error updating transaction";
        res.redirect("/dashboard/transactions");
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.session.user.id;

        const transaction = await Transaction.findOne({
            where: {
                id: transactionId,
                user_id: userId
            }
        });

        if (!transaction) {
            req.session.error = "Transaction not found";
            return res.redirect("/dashboard/transactions");
        }

        await transaction.destroy();

        req.session.success = "Transaction deleted successfully";
        res.redirect("/dashboard/transactions");
    } catch (error) {
        console.error("Error deleting transaction:", error);
        req.session.error = "Error deleting transaction";
        res.redirect("/dashboard/transactions");
    }
};

exports.exportTransactions = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { start_date, end_date, type } = req.query;

        let whereClause = { user_id: userId };

        if (start_date && end_date) {
            whereClause.transaction_date = {
                [Op.between]: [start_date, end_date]
            };
        }

        if (type && ['income', 'expense'].includes(type)) {
            whereClause.type = type;
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    attributes: ['category_name']
                }
            ],
            order: [['transaction_date', 'DESC']]
        });

        let csvContent = "Date,Type,Amount,Category,Description\\n";

        transactions.forEach(transaction => {
            const date = transaction.transaction_date;
            const type = transaction.type;
            const amount = transaction.amount;
            const category = transaction.Category ? transaction.Category.category_name : 'Uncategorized';
            const description = transaction.description || '';

            csvContent += `${date},${type},${amount},${category},"${description}"\\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

        res.send(csvContent);
    } catch (error) {
        console.error("Error exporting transactions:", error);
        req.session.error = "Error exporting transactions";
        res.redirect("/dashboard/transactions");
    }
};

exports.getTransactionDetails = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.session.user.id;

        const transaction = await Transaction.findOne({
            where: {
                id: transactionId,
                user_id: userId
            },
            include: [
                {
                    model: Category,
                    attributes: ['id', 'category_name']
                }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        res.json(transaction);
    } catch (error) {
        console.error("Error getting transaction details:", error);
        res.status(500).json({ error: "Error loading transaction details" });
    }
};

exports.getMonthlyTransactions = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        const now = new Date();
        const monthlyData = [];
        
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
            const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const transactions = await Transaction.findAll({
                where: {
                    user_id: userId,
                    transaction_date: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });
            
            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const monthName = startOfMonth.toLocaleString('default', { month: 'short' }) + 
                              ' ' + startOfMonth.getFullYear().toString().substr(-2);
            
            monthlyData.push({
                month: monthName,
                income: parseFloat(income.toFixed(2)),
                expenses: parseFloat(expenses.toFixed(2))
            });
        }
        
        res.json(monthlyData);
    } catch (error) {
        console.error("Error getting monthly transactions:", error);
        res.status(500).json({ error: "Error loading monthly transactions data" });
    }
};

exports.getSpendingTrend = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        const now = new Date();
        const trendData = [];
        
        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
            const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const transactions = await Transaction.findAll({
                where: {
                    user_id: userId,
                    type: 'expense',
                    transaction_date: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });
            
            const totalSpending = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const monthName = startOfMonth.toLocaleString('default', { month: 'short' }) + 
                              ' ' + startOfMonth.getFullYear().toString().substr(-2);
            
            trendData.push({
                month: monthName,
                amount: parseFloat(totalSpending.toFixed(2))
            });
        }
        
        res.json(trendData);
    } catch (error) {
        console.error("Error getting spending trend:", error);
        res.status(500).json({ error: "Error loading spending trend data" });
    }
};

exports.getTransactionsSummary = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { period = 'month', all = false } = req.query;

        let dateFilter = {};
        const now = new Date();

        if (all !== 'true') {
            if (period === 'month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                dateFilter = {
                    transaction_date: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                };
            } else if (period === 'year') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                const endOfYear = new Date(now.getFullYear(), 11, 31);
                dateFilter = {
                    transaction_date: {
                        [Op.between]: [startOfYear, endOfYear]
                    }
                };
            }
        }

        const transactions = await Transaction.findAll({
            where: {
                user_id: userId,
                ...dateFilter
            },
            include: [
                {
                    model: Category,
                    attributes: ['category_name']
                }
            ],
            order: [['transaction_date', 'DESC']]
        });

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expensesByCategory = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const categoryName = t.Category ? t.Category.category_name : 'Uncategorized';
                expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + parseFloat(t.amount);
            });

        res.json({
            income: income.toFixed(2),
            expenses: expenses.toFixed(2),
            balance: (income - expenses).toFixed(2),
            expensesByCategory: expensesByCategory,
            recentTransactions: transactions.slice(0, 5)
        });
    } catch (error) {
        console.error("Error getting transactions summary:", error);
        res.status(500).json({ error: "Error loading transactions summary" });
    }
};
