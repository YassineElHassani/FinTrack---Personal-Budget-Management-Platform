const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Saving extends Model { }

Saving.init(
    {
        saving_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        goal_name: { type: DataTypes.STRING },
    },
    { sequelize, modelName: "Saving" }
);

module.exports = Saving;