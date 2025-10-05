const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Transaction extends Model { }

Transaction.init(
    {
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        type: { type: DataTypes.ENUM("income", "expense"), allowNull: false },
        description: { type: DataTypes.TEXT },
        transaction_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "Transaction", timestamps: false }
);

module.exports = Transaction;