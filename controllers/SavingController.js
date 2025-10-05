const { Saving } = require("../models");
const { Op } = require("sequelize");

exports.renderSavingPage = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const savings = await Saving.findAll({
            where: { user_id: userId },
            order: [['target_date', 'ASC']]
        });

        const savingsWithProgress = savings.map(saving => {
            const progressPercentage = saving.goal_amount > 0
                ? ((saving.saved_amount / saving.goal_amount) * 100).toFixed(1)
                : 0;

            const remainingAmount = saving.goal_amount - saving.saved_amount;

            let daysUntilTarget = null;
            if (saving.target_date) {
                const targetDate = new Date(saving.target_date);
                const today = new Date();
                const timeDiff = targetDate.getTime() - today.getTime();
                daysUntilTarget = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }

            let status = 'in-progress';
            if (saving.saved_amount >= saving.goal_amount) {
                status = 'completed';
            } else if (daysUntilTarget !== null && daysUntilTarget < 0) {
                status = 'overdue';
            }

            return {
                ...saving.toJSON(),
                progressPercentage,
                remainingAmount: remainingAmount.toFixed(2),
                daysUntilTarget,
                status
            };
        });

        const totalGoals = savings.length;
        const completedGoals = savingsWithProgress.filter(s => s.status === 'completed').length;
        const totalGoalAmount = savings.reduce((sum, s) => sum + parseFloat(s.goal_amount), 0);
        const totalSavedAmount = savings.reduce((sum, s) => sum + parseFloat(s.saved_amount), 0);

        res.render("saving", {
            username: req.session.user.username,
            email: req.session.user.email,
            title: "Savings Goals",
            page: "saving-page",
            savings: savingsWithProgress,
            totalGoals,
            completedGoals,
            totalGoalAmount: totalGoalAmount.toFixed(2),
            totalSavedAmount: totalSavedAmount.toFixed(2),
            overallProgress: totalGoalAmount > 0 ? ((totalSavedAmount / totalGoalAmount) * 100).toFixed(1) : 0,
            success: req.session.success,
            error: req.session.error
        });

        delete req.session.success;
        delete req.session.error;
    } catch (error) {
        console.error("Error loading saving page:", error);
        req.session.error = "Error loading savings data";
        res.redirect("/dashboard");
    }
};

exports.createSaving = async (req, res) => {
    try {
        const { goal_name, goal_amount, target_date, saved_amount } = req.body;
        const userId = req.session.user.id;

        if (!goal_name || !goal_amount) {
            req.session.error = "Goal name and amount are required";
            return res.redirect("/dashboard/saving");
        }

        if (goal_amount <= 0) {
            req.session.error = "Goal amount must be greater than 0";
            return res.redirect("/dashboard/saving");
        }

        const savedAmount = saved_amount ? parseFloat(saved_amount) : 0;
        if (savedAmount < 0) {
            req.session.error = "Saved amount cannot be negative";
            return res.redirect("/dashboard/saving");
        }

        if (savedAmount > parseFloat(goal_amount)) {
            req.session.error = "Saved amount cannot exceed goal amount";
            return res.redirect("/dashboard/saving");
        }

        if (target_date) {
            const targetDateObj = new Date(target_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (targetDateObj < today) {
                req.session.error = "Target date cannot be in the past";
                return res.redirect("/dashboard/saving");
            }
        }

        const existingGoal = await Saving.findOne({
            where: {
                user_id: userId,
                goal_name: goal_name.trim()
            }
        });

        if (existingGoal) {
            req.session.error = "A savings goal with this name already exists";
            return res.redirect("/dashboard/saving");
        }

        await Saving.create({
            user_id: userId,
            goal_name: goal_name.trim(),
            goal_amount: parseFloat(goal_amount),
            saved_amount: savedAmount,
            target_date: target_date || null
        });

        req.session.success = "Savings goal created successfully";
        res.redirect("/dashboard/saving");
    } catch (error) {
        console.error("Error creating savings goal:", error);
        req.session.error = "Error creating savings goal";
        res.redirect("/dashboard/saving");
    }
};

exports.updateSaving = async (req, res) => {
    try {
        const savingId = req.params.id;
        const { goal_name, goal_amount, target_date, saved_amount } = req.body;
        const userId = req.session.user.id;

        const saving = await Saving.findOne({
            where: {
                id: savingId,
                user_id: userId
            }
        });

        if (!saving) {
            req.session.error = "Savings goal not found";
            return res.redirect("/dashboard/saving");
        }

        if (!goal_name || !goal_amount) {
            req.session.error = "Goal name and amount are required";
            return res.redirect("/dashboard/saving");
        }

        if (goal_amount <= 0) {
            req.session.error = "Goal amount must be greater than 0";
            return res.redirect("/dashboard/saving");
        }

        const savedAmount = saved_amount ? parseFloat(saved_amount) : 0;
        if (savedAmount < 0) {
            req.session.error = "Saved amount cannot be negative";
            return res.redirect("/dashboard/saving");
        }

        if (savedAmount > parseFloat(goal_amount)) {
            req.session.error = "Saved amount cannot exceed goal amount";
            return res.redirect("/dashboard/saving");
        }

        if (target_date) {
            const targetDateObj = new Date(target_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (targetDateObj < today) {
                req.session.error = "Target date cannot be in the past";
                return res.redirect("/dashboard/saving");
            }
        }

        const existingGoal = await Saving.findOne({
            where: {
                user_id: userId,
                goal_name: goal_name.trim(),
                id: {
                    [Op.ne]: savingId
                }
            }
        });

        if (existingGoal) {
            req.session.error = "Another savings goal with this name already exists";
            return res.redirect("/dashboard/saving");
        }

        await saving.update({
            goal_name: goal_name.trim(),
            goal_amount: parseFloat(goal_amount),
            saved_amount: savedAmount,
            target_date: target_date || null
        });

        req.session.success = "Savings goal updated successfully";
        res.redirect("/dashboard/saving");
    } catch (error) {
        console.error("Error updating savings goal:", error);
        req.session.error = "Error updating savings goal";
        res.redirect("/dashboard/saving");
    }
};

exports.deleteSaving = async (req, res) => {
    try {
        const savingId = req.params.id;
        const userId = req.session.user.id;

        const saving = await Saving.findOne({
            where: {
                id: savingId,
                user_id: userId
            }
        });

        if (!saving) {
            req.session.error = "Savings goal not found";
            return res.redirect("/dashboard/saving");
        }

        await saving.destroy();

        req.session.success = "Savings goal deleted successfully";
        res.redirect("/dashboard/saving");
    } catch (error) {
        console.error("Error deleting savings goal:", error);
        req.session.error = "Error deleting savings goal";
        res.redirect("/dashboard/saving");
    }
};

exports.addToSaving = async (req, res) => {
    try {
        const savingId = req.params.id;
        const { amount } = req.body;
        const userId = req.session.user.id;

        const saving = await Saving.findOne({
            where: {
                id: savingId,
                user_id: userId
            }
        });

        if (!saving) {
            req.session.error = "Savings goal not found";
            return res.redirect("/dashboard/saving");
        }

        if (!amount || amount <= 0) {
            req.session.error = "Amount must be greater than 0";
            return res.redirect("/dashboard/saving");
        }

        const addAmount = parseFloat(amount);
        const newSavedAmount = parseFloat(saving.saved_amount) + addAmount;

        if (newSavedAmount > parseFloat(saving.goal_amount)) {
            req.session.error = "Adding this amount would exceed your goal. Consider updating your goal amount first.";
            return res.redirect("/dashboard/saving");
        }

        await saving.update({
            saved_amount: newSavedAmount
        });

        req.session.success = `Successfully added $${addAmount.toFixed(2)} to ${saving.goal_name}`;
        res.redirect("/dashboard/saving");
    } catch (error) {
        console.error("Error adding to savings:", error);
        req.session.error = "Error adding to savings goal";
        res.redirect("/dashboard/saving");
    }
};

exports.getSavingDetails = async (req, res) => {
    try {
        const savingId = req.params.id;
        const userId = req.session.user.id;

        const saving = await Saving.findOne({
            where: {
                id: savingId,
                user_id: userId
            }
        });

        if (!saving) {
            return res.status(404).json({ error: "Savings goal not found" });
        }

        const progressPercentage = saving.goal_amount > 0 ? ((saving.saved_amount / saving.goal_amount) * 100).toFixed(1) : 0;

        const remainingAmount = saving.goal_amount - saving.saved_amount;

        let daysUntilTarget = null;
        if (saving.target_date) {
            const targetDate = new Date(saving.target_date);
            const today = new Date();
            const timeDiff = targetDate.getTime() - today.getTime();
            daysUntilTarget = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }

        res.json({
            ...saving.toJSON(),
            progressPercentage,
            remainingAmount: remainingAmount.toFixed(2),
            daysUntilTarget
        });
    } catch (error) {
        console.error("Error getting saving details:", error);
        res.status(500).json({ error: "Error loading saving details" });
    }
};

exports.getSavingsSummary = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const savings = await Saving.findAll({
            where: { user_id: userId }
        });

        const totalGoals = savings.length;
        const completedGoals = savings.filter(s => parseFloat(s.saved_amount) >= parseFloat(s.goal_amount)).length;
        const totalGoalAmount = savings.reduce((sum, s) => sum + parseFloat(s.goal_amount), 0);
        const totalSavedAmount = savings.reduce((sum, s) => sum + parseFloat(s.saved_amount), 0);
        const overallProgress = totalGoalAmount > 0 ? ((totalSavedAmount / totalGoalAmount) * 100).toFixed(1) : 0;

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const upcomingDeadlines = savings.filter(s => {
            if (!s.target_date) return false;
            const targetDate = new Date(s.target_date);
            const today = new Date();
            return targetDate >= today && targetDate <= thirtyDaysFromNow;
        });

        res.json({
            totalGoals,
            completedGoals,
            totalGoalAmount: totalGoalAmount.toFixed(2),
            totalSavedAmount: totalSavedAmount.toFixed(2),
            overallProgress,
            upcomingDeadlines: upcomingDeadlines.length,
            recentGoals: savings.slice(-3)
        });
    } catch (error) {
        console.error("Error getting savings summary:", error);
        res.status(500).json({ error: "Error loading savings summary" });
    }
};
