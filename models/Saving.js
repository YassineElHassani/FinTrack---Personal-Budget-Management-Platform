const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Saving extends Model { }

Saving.init(
    {
        goal_name: { type: DataTypes.STRING },
        goal_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        saved_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        target_date: { type: DataTypes.DATEONLY },
    },
    { sequelize, modelName: "Saving", timestamps: false }
);

module.exports = Saving;