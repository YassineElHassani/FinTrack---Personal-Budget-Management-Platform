const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Category extends Model {}

Category.init(
  {
    category_name: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: 'Category' }
);

module.exports = Category;