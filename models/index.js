const User = require("./User");
const Budget = require("./Budget");
const Transaction = require("./Transaction");
const Saving = require("./Saving");
const Category = require("./Category");

// User -> Budgets
User.hasMany(Budget, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'user_id' });

// Budget -> Transactions
Budget.hasMany(Transaction, { foreignKey: 'budget_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Budget, { foreignKey: 'budget_id' });

// Budget -> Savings
Budget.hasMany(Saving, { foreignKey: 'budget_id', onDelete: 'CASCADE' });
Saving.belongsTo(Budget, { foreignKey: 'budget_id' });

// Budget -> Categories
Budget.hasMany(Category, { foreignKey: 'budget_id', onDelete: 'CASCADE' });
Category.belongsTo(Budget, { foreignKey: 'budget_id' });

// Category -> Transactions
Category.hasMany(Transaction, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = { User, Budget, Transaction, Saving, Category };