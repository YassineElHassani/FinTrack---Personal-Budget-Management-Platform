const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Budget extends Model {
    async calculateBalance() {
        const transactions = await this.getTransactions();
        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return this.total_amount + totalIncome - totalExpense;
    }
}

Budget.init(
    {
        total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, }
    },
    { sequelize, modelName: "Budget" }
);

module.exports = Budget;