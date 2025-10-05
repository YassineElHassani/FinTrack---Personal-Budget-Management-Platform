const { Category, Transaction } = require("../models");
const { Op } = require("sequelize");

exports.renderCategoryPage = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const categories = await Category.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Transaction,
                    attributes: ['id', 'amount', 'type'],
                    required: false
                }
            ],
            order: [['category_name', 'ASC']]
        });

        const categoriesWithStats = categories.map(category => {
            const transactions = category.Transactions || [];
            const transactionCount = transactions.length;
            const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const incomeAmount = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const expenseAmount = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            return {
                ...category.toJSON(),
                transactionCount,
                totalAmount: totalAmount.toFixed(2),
                incomeAmount: incomeAmount.toFixed(2),
                expenseAmount: expenseAmount.toFixed(2)
            };
        });

        res.render("category", {
            username: req.session.user.username,
            email: req.session.user.email,
            title: "Category Management",
            page: "category-page",
            categories: categoriesWithStats,
            success: req.session.success,
            error: req.session.error
        });

        delete req.session.success;
        delete req.session.error;
    } catch (error) {
        console.error("Error loading category page:", error);
        req.session.error = "Error loading category data";
        res.redirect("/dashboard");
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        const userId = req.session.user.id;

        if (!category_name || category_name.trim().length === 0) {
            req.session.error = "Category name is required";
            return res.redirect("/dashboard/category");
        }

        const trimmedName = category_name.trim();

        const existingCategory = await Category.findOne({
            where: {
                user_id: userId,
                category_name: {
                    [Op.like]: trimmedName
                }
            }
        });

        if (existingCategory) {
            req.session.error = "Category with this name already exists";
            return res.redirect("/dashboard/category");
        }

        await Category.create({
            user_id: userId,
            category_name: trimmedName
        });

        req.session.success = "Category created successfully";
        res.redirect("/dashboard/category");
    } catch (error) {
        console.error("Error creating category:", error);
        req.session.error = "Error creating category";
        res.redirect("/dashboard/category");
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { category_name } = req.body;
        const userId = req.session.user.id;

        const category = await Category.findOne({
            where: {
                id: categoryId,
                user_id: userId
            }
        });

        if (!category) {
            req.session.error = "Category not found";
            return res.redirect("/dashboard/category");
        }

        if (!category_name || category_name.trim().length === 0) {
            req.session.error = "Category name is required";
            return res.redirect("/dashboard/category");
        }

        const trimmedName = category_name.trim();

        const existingCategory = await Category.findOne({
            where: {
                user_id: userId,
                category_name: {
                    [Op.like]: trimmedName
                },
                id: {
                    [Op.ne]: categoryId
                }
            }
        });

        if (existingCategory) {
            req.session.error = "Another category with this name already exists";
            return res.redirect("/dashboard/category");
        }

        await category.update({
            category_name: trimmedName
        });

        req.session.success = "Category updated successfully";
        res.redirect("/dashboard/category");
    } catch (error) {
        console.error("Error updating category:", error);
        req.session.error = "Error updating category";
        res.redirect("/dashboard/category");
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const userId = req.session.user.id;

        const category = await Category.findOne({
            where: {
                id: categoryId,
                user_id: userId
            }
        });

        if (!category) {
            req.session.error = "Category not found";
            return res.redirect("/dashboard/category");
        }

        const transactionCount = await Transaction.count({
            where: {
                category_id: categoryId
            }
        });

        if (transactionCount > 0) {
            req.session.error = `Cannot delete category. It is used in ${transactionCount} transaction(s). Please reassign or delete those transactions first.`;
            return res.redirect("/dashboard/category");
        }

        await category.destroy();

        req.session.success = "Category deleted successfully";
        res.redirect("/dashboard/category");
    } catch (error) {
        console.error("Error deleting category:", error);
        req.session.error = "Error deleting category";
        res.redirect("/dashboard/category");
    }
};

exports.getCategoryDetails = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const userId = req.session.user.id;

        const category = await Category.findOne({
            where: {
                id: categoryId,
                user_id: userId
            },
            include: [
                {
                    model: Transaction,
                    attributes: ['id', 'amount', 'type', 'transaction_date', 'description'],
                    order: [['transaction_date', 'DESC']]
                }
            ]
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        console.error("Error getting category details:", error);
        res.status(500).json({ error: "Error loading category details" });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const categories = await Category.findAll({
            where: { user_id: userId },
            attributes: ['id', 'category_name'],
            order: [['category_name', 'ASC']]
        });

        res.json(categories);
    } catch (error) {
        console.error("Error getting categories:", error);
        res.status(500).json({ error: "Error loading categories" });
    }
};

exports.getCategoryAnalysis = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { period = 'month' } = req.query;

        let dateFilter = {};
        const now = new Date();

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

        const categories = await Category.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Transaction,
                    where: dateFilter,
                    required: false,
                    attributes: ['amount', 'type']
                }
            ]
        });

        const categoryAnalysis = categories.map(category => {
            const transactions = category.Transactions || [];
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            return {
                id: category.id,
                name: category.category_name,
                expenses: expenses.toFixed(2),
                income: income.toFixed(2),
                net: (income - expenses).toFixed(2),
                transactionCount: transactions.length
            };
        });

        categoryAnalysis.sort((a, b) => parseFloat(b.expenses) - parseFloat(a.expenses));

        res.json(categoryAnalysis);
    } catch (error) {
        console.error("Error getting category analysis:", error);
        res.status(500).json({ error: "Error loading category analysis" });
    }
};
