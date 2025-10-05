const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Budget extends Model {
    async calculateSpentAmount() {
        const { Transaction } = require("./index");
        const { Op } = require("sequelize");
        
        const [year, month] = this.month_year.split('-').map(Number);
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        
        const transactions = await Transaction.findAll({
            where: {
                user_id: this.user_id,
                type: 'expense',
                transaction_date: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        return transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }
}

Budget.init(
    {
        name: { type: DataTypes.STRING, allowNull: false },
        total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        month_year: { type: DataTypes.STRING(7), allowNull: true }
    },
    { sequelize, modelName: "Budget", timestamps: false }
);

module.exports = Budget;