const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class User extends Model { }

User.init(
    {
        username: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
        resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: "User", timestamps: false }
);

module.exports = User;