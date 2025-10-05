const bcrypt = require("bcrypt");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Category = require("../models/Category");
const Saving = require("../models/Saving");
const { Op } = require('sequelize');

exports.renderHomePage = (req, res) => {
    res.render("index", {
        title: "Home Page",
        message: "Welcome to FinTrack! Manage your budget with ease."
    });
};

exports.render404Page = (req, res) => {
    res.render("404", {
        title: "404 - Page Not Found | FinTrack"
    });
};

exports.renderLoginPage = (req, res) => {
    const success = req.session.success;
    delete req.session.success;
    res.render("login", {
        title: "Login Page",
        success: success,
        error: null
    });
}

exports.renderRegisterPage = (req, res) => {
    res.render("register", { title: "Register Page" });
}

exports.renderResetPasswordPage = (req, res) => {
    res.render("reset-request", { title: "Reset Password" });
}

exports.renderDashboardPage = (req, res) => {
    res.render("dashboard", {
        username: req.session.user.username,
        title: "Dashboard",
        page: "dashboard-page"
    });
}

exports.renderProfilePage = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const user = await User.findByPk(userId);

        const [transactions, budgets, categories, savings] = await Promise.all([
            Transaction.findAll({ where: { user_id: userId } }),
            Budget.findAll({ where: { user_id: userId } }),
            Category.findAll({ where: { user_id: userId } }),
            Saving.findAll({ where: { user_id: userId } })
        ]);

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const currentBalance = (income - expenses).toFixed(2);

        const totalSaved = savings
            .reduce((sum, s) => sum + parseFloat(s.current_amount || 0), 0)
            .toFixed(2);

        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const monthlyExpenses = transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' &&
                       transactionDate >= startOfMonth &&
                       transactionDate <= endOfMonth;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
            .toFixed(2);

        const stats = {
            totalTransactions: transactions.length,
            totalBudgets: budgets.length,
            totalCategories: categories.length,
            totalSavings: savings.length,
            currentBalance,
            totalSaved,
            monthlyExpenses
        };

        res.render("profile", {
            username: req.session.user.username,
            user: user,
            stats: stats,
            title: "Profile",
            page: "profile-page",
            success: req.flash ? req.flash('success') : null,
            error: req.flash ? req.flash('error') : null
        });
    } catch (error) {
        console.error('Profile page error:', error);
        res.render("profile", {
            username: req.session.user.username,
            user: req.session.user,
            stats: {
                totalTransactions: 0,
                totalBudgets: 0,
                totalCategories: 0,
                totalSavings: 0,
                currentBalance: '0.00',
                totalSaved: '0.00',
                monthlyExpenses: '0.00'
            },
            title: "Profile",
            page: "profile-page",
            error: "Error loading profile data"
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.render("register", {
                error: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.render("register", {
                error: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword
        });

        req.session.success = "Registration successful. Please log in.";
        return res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.render("register", {
            error: "Server error"
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.render("login", {
                title: "Login Page",
                error: "Invalid email address, this email is not registered"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", {
                title: "Login Page",
                error: "Your password is incorrect"
            });
        }

        req.session.user = { id: user.id, username: user.username, email: user.email };

        return res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
        res.render("login", {
            title: "Login Page",
            error: "Server error"
        });
    }
};

exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });

        res.redirect('/');
    });
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { username, email, full_name, phone } = req.body;

        if (email !== req.session.user.email) {
            const existingUser = await User.findOne({
                where: {
                    email,
                    id: { [Op.ne]: userId }
                }
            });

            if (existingUser) {
                if (req.flash) req.flash('error', 'Email is already taken by another user');
                return res.redirect('/dashboard/profile');
            }
        }

        await User.update(
            { username, email },
            { where: { id: userId } }
        );

        req.session.user.username = username;
        req.session.user.email = email;

        if (req.flash) req.flash('success', 'Profile updated successfully');
        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error('Update profile error:', error);
        if (req.flash) req.flash('error', 'Error updating profile');
        res.redirect('/dashboard/profile');
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { current_password, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            if (req.flash) req.flash('error', 'New passwords do not match');
            return res.redirect('/dashboard/profile');
        }

        const user = await User.findByPk(userId);

        const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
        if (!isCurrentPasswordValid) {
            if (req.flash) req.flash('error', 'Current password is incorrect');
            return res.redirect('/dashboard/profile');
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await User.update(
            { password: hashedPassword },
            { where: { id: userId } }
        );

        if (req.flash) req.flash('success', 'Password changed successfully');
        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error('Change password error:', error);
        if (req.flash) req.flash('error', 'Error changing password');
        res.redirect('/dashboard/profile');
    }
};

exports.exportUserData = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [user, transactions, budgets, categories, savings] = await Promise.all([
            User.findByPk(userId),
            Transaction.findAll({ where: { user_id: userId } }),
            Budget.findAll({ where: { user_id: userId } }),
            Category.findAll({ where: { user_id: userId } }),
            Saving.findAll({ where: { user_id: userId } })
        ]);

        let csv = 'Data Type,ID,Name,Amount,Date,Category,Notes\n';

        transactions.forEach(t => {
            csv += `Transaction,${t.id},"${t.description}",${t.amount},${t.date},${t.category_id},"${t.notes || ''}"\n`;
        });

        budgets.forEach(b => {
            csv += `Budget,${b.id},"${b.name}",${b.amount},${b.start_date},${b.category_id},"Period: ${b.period}"\n`;
        });

        savings.forEach(s => {
            csv += `Saving,${s.id},"${s.goal_name}",${s.target_amount},${s.target_date},"","Current: ${s.current_amount}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="fintrack_data_${user.username}_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export data error:', error);
        if (req.flash) req.flash('error', 'Error exporting data');
        res.redirect('/dashboard/profile');
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.session.user.id;

        await Promise.all([
            Transaction.destroy({ where: { user_id: userId } }),
            Budget.destroy({ where: { user_id: userId } }),
            Category.destroy({ where: { user_id: userId } }),
            Saving.destroy({ where: { user_id: userId } })
        ]);

        await User.destroy({ where: { id: userId } });

        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/?message=Account deleted successfully');
        });
    } catch (error) {
        console.error('Delete account error:', error);
        if (req.flash) req.flash('error', 'Error deleting account');
        res.redirect('/dashboard/profile');
    }
};