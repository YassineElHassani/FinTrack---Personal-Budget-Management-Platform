const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const BudgetController = require("../controllers/BudgetController");
const TransactionController = require("../controllers/TransactionController");
const CategoryController = require("../controllers/CategoryController");
const SavingController = require("../controllers/SavingController");
const isAuthenticated = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const PasswordController = require("../controllers/PasswordController");

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many requests from this IP, please try again later.",
});

// Public routes
router.get("/", UserController.renderHomePage);
router.get("/register", UserController.renderRegisterPage);
router.post("/register", UserController.register);
router.get("/login", UserController.renderLoginPage);
router.post("/login", UserController.login);

// Password reset routes
router.get("/password/reset-request", PasswordController.renderResetRequestForm);
router.post("/password/reset-request", resetLimiter, PasswordController.requestPasswordReset);
router.get("/reset-password/:token", PasswordController.renderResetForm);
router.post("/reset-password/:token", [ body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"), ], PasswordController.resetPassword);

// Protected dashboard routes
router.get("/dashboard", isAuthenticated, UserController.renderDashboardPage);
router.get("/dashboard/profile", isAuthenticated, UserController.renderProfilePage);

// Profile management routes
router.post("/dashboard/profile/update", isAuthenticated, UserController.updateProfile);
router.post("/dashboard/profile/change-password", isAuthenticated, UserController.changePassword);
router.get("/dashboard/profile/export", isAuthenticated, UserController.exportUserData);
router.get("/dashboard/profile/delete-account", isAuthenticated, UserController.deleteAccount);

// Budget routes
router.get("/dashboard/budget", isAuthenticated, BudgetController.renderBudgetPage);
router.post("/dashboard/budget", isAuthenticated, BudgetController.createBudget);
router.put("/dashboard/budget/:id", isAuthenticated, BudgetController.updateBudget);
router.delete("/dashboard/budget/:id", isAuthenticated, BudgetController.deleteBudget);
router.get("/api/budget/:id", isAuthenticated, BudgetController.getBudgetDetails);
router.get("/api/budget-overview", isAuthenticated, BudgetController.getBudgetOverview);

// Transaction routes
router.get("/dashboard/transactions", isAuthenticated, TransactionController.renderTransactionsPage);
router.post("/dashboard/transactions", isAuthenticated, TransactionController.createTransaction);
router.put("/dashboard/transactions/:id", isAuthenticated, TransactionController.updateTransaction);
router.delete("/dashboard/transactions/:id", isAuthenticated, TransactionController.deleteTransaction);
router.get("/dashboard/transactions/export", isAuthenticated, TransactionController.exportTransactions);
router.get("/api/transactions/:id", isAuthenticated, TransactionController.getTransactionDetails);
router.get("/api/transactions-summary", isAuthenticated, TransactionController.getTransactionsSummary);
router.get("/api/transactions-monthly", isAuthenticated, TransactionController.getMonthlyTransactions);
router.get("/api/spending-trend", isAuthenticated, TransactionController.getSpendingTrend);

// Category routes
router.get("/dashboard/category", isAuthenticated, CategoryController.renderCategoryPage);
router.post("/dashboard/category", isAuthenticated, CategoryController.createCategory);
router.put("/dashboard/category/:id", isAuthenticated, CategoryController.updateCategory);
router.delete("/dashboard/category/:id", isAuthenticated, CategoryController.deleteCategory);
router.get("/api/categories", isAuthenticated, CategoryController.getAllCategories);
router.get("/api/category/:id", isAuthenticated, CategoryController.getCategoryDetails);
router.get("/api/category-analysis", isAuthenticated, CategoryController.getCategoryAnalysis);

// Saving routes
router.get("/dashboard/saving", isAuthenticated, SavingController.renderSavingPage);
router.post("/dashboard/saving", isAuthenticated, SavingController.createSaving);
router.put("/dashboard/saving/:id", isAuthenticated, SavingController.updateSaving);
router.delete("/dashboard/saving/:id", isAuthenticated, SavingController.deleteSaving);
router.post("/dashboard/saving/:id/add", isAuthenticated, SavingController.addToSaving);
router.get("/api/saving/:id", isAuthenticated, SavingController.getSavingDetails);
router.get("/api/savings-summary", isAuthenticated, SavingController.getSavingsSummary);

// Logout
router.post("/logout", UserController.logout);


module.exports = router;