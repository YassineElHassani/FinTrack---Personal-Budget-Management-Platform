const User = require("./User");
const Budget = require("./Budget");
const Transaction = require("./Transaction");
const Saving = require("./Saving");
const Category = require("./Category");

User.hasMany(Budget, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Category, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Saving, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Saving.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Transaction, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = { User, Budget, Transaction, Saving, Category };