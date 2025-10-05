const { Budget, Transaction, Category } = require("../models");
const { Op } = require("sequelize");

exports.renderBudgetPage = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const budgets = await Budget.findAll({
            where: { user_id: userId },
            order: [['month_year', 'DESC']]
        });

        const categories = await Category.findAll({
            where: { user_id: userId }
        });

        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const spentAmount = await budget.calculateSpentAmount();
            return {
                ...budget.toJSON(),
                spent_amount: spentAmount,
                remaining_amount: budget.total_amount - spentAmount,
                percentage_used: ((spentAmount / budget.total_amount) * 100).toFixed(1)
            };
        }));

        res.render("budget", {
            username: req.session.user.username,
            email: req.session.user.email,
            title: "Budget Management",
            page: "budget-page",
            budgets: budgetsWithSpent,
            categories: categories,
            success: req.session.success,
            error: req.session.error
        });

        delete req.session.success;
        delete req.session.error;
    } catch (error) {
        console.error("Error loading budget page:", error);
        req.session.error = "Error loading budget data";
        res.redirect("/dashboard");
    }
};

exports.createBudget = async (req, res) => {
    try {
        const { name, total_amount, month_year } = req.body;
        const userId = req.session.user.id;

        if (!name || !total_amount || !month_year) {
            req.session.error = "All fields are required";
            return res.redirect("/dashboard/budget");
        }

        if (total_amount <= 0) {
            req.session.error = "Budget amount must be greater than 0";
            return res.redirect("/dashboard/budget");
        }

        const existingBudget = await Budget.findOne({
            where: {
                user_id: userId,
                name: name,
                month_year: month_year
            }
        });

        if (existingBudget) {
            req.session.error = "Budget with this name already exists for this month";
            return res.redirect("/dashboard/budget");
        }

        await Budget.create({
            user_id: userId,
            name: name,
            total_amount: parseFloat(total_amount),
            month_year: month_year
        });

        req.session.success = "Budget created successfully";
        res.redirect("/dashboard/budget");
    } catch (error) {
        console.error("Error creating budget:", error);
        req.session.error = "Error creating budget";
        res.redirect("/dashboard/budget");
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const { name, total_amount, month_year } = req.body;
        const userId = req.session.user.id;

        const budget = await Budget.findOne({
            where: {
                id: budgetId,
                user_id: userId
            }
        });

        if (!budget) {
            req.session.error = "Budget not found";
            return res.redirect("/dashboard/budget");
        }

        if (!name || !total_amount || !month_year) {
            req.session.error = "All fields are required";
            return res.redirect("/dashboard/budget");
        }

        if (total_amount <= 0) {
            req.session.error = "Budget amount must be greater than 0";
            return res.redirect("/dashboard/budget");
        }

        await budget.update({
            name: name,
            total_amount: parseFloat(total_amount),
            month_year: month_year
        });

        req.session.success = "Budget updated successfully";
        res.redirect("/dashboard/budget");
    } catch (error) {
        console.error("Error updating budget:", error);
        req.session.error = "Error updating budget";
        res.redirect("/dashboard/budget");
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const userId = req.session.user.id;

        const budget = await Budget.findOne({
            where: {
                id: budgetId,
                user_id: userId
            }
        });

        if (!budget) {
            req.session.error = "Budget not found";
            return res.redirect("/dashboard/budget");
        }

        await budget.destroy();

        req.session.success = "Budget deleted successfully";
        res.redirect("/dashboard/budget");
    } catch (error) {
        console.error("Error deleting budget:", error);
        req.session.error = "Error deleting budget";
        res.redirect("/dashboard/budget");
    }
};

exports.getBudgetDetails = async (req, res) => {
    try {
        const budgetId = req.params.id;
        const userId = req.session.user.id;

        const budget = await Budget.findOne({
            where: {
                id: budgetId,
                user_id: userId
            }
        });

        if (!budget) {
            return res.status(404).json({ error: "Budget not found" });
        }

        const spentAmount = await budget.calculateSpentAmount();

        res.json({
            ...budget.toJSON(),
            spent_amount: spentAmount,
            remaining_amount: budget.total_amount - spentAmount,
            percentage_used: ((spentAmount / budget.total_amount) * 100).toFixed(1)
        });
    } catch (error) {
        console.error("Error getting budget details:", error);
        res.status(500).json({ error: "Error loading budget details" });
    }
};

exports.getBudgetOverview = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Get current month's budgets
        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const budgets = await Budget.findAll({
            where: {
                user_id: userId,
                month_year: currentMonthYear
            }
        });
        
        // If no budgets for current month, try to find any recent budgets
        let budgetsWithData = [];
        
        if (budgets.length === 0) {
            // Find the most recent budgets
            const recentBudgets = await Budget.findAll({
                where: { user_id: userId },
                order: [['month_year', 'DESC']],
                limit: 3
            });
            
            if (recentBudgets.length > 0) {
                budgetsWithData = await Promise.all(recentBudgets.map(async (budget) => {
                    const spentAmount = await budget.calculateSpentAmount();
                    const percentageUsed = ((spentAmount / budget.total_amount) * 100).toFixed(1);
                    
                    return {
                        id: budget.id,
                        name: budget.name,
                        total_amount: budget.total_amount,
                        spent_amount: spentAmount.toFixed(2),
                        remaining_amount: (budget.total_amount - spentAmount).toFixed(2),
                        percentage_used: percentageUsed
                    };
                }));
            }
        } else {
            // Get spending data for each budget
            budgetsWithData = await Promise.all(budgets.map(async (budget) => {
                const spentAmount = await budget.calculateSpentAmount();
                const percentageUsed = ((spentAmount / budget.total_amount) * 100).toFixed(1);
                
                return {
                    id: budget.id,
                    name: budget.name,
                    total_amount: budget.total_amount,
                    spent_amount: spentAmount.toFixed(2),
                    remaining_amount: (budget.total_amount - spentAmount).toFixed(2),
                    percentage_used: percentageUsed
                };
            }));
        }
        
        res.json({
            budgets: budgetsWithData
        });
    } catch (error) {
        console.error("Error getting budget overview:", error);
        res.status(500).json({ error: "Error loading budget overview data" });
    }
};
