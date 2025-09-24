const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Transaction extends Model { }

Transaction.init(
    {
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        type: { type: DataTypes.ENUM("income", "expense"), allowNull: false },
        description: { type: DataTypes.STRING },
        date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: "Transaction" }
);

module.exports = Transaction;