"use strict";

module.exports = (sequelize, DataTypes) => {
  const CategoryProduct = sequelize.define(
    "category_products",
    {
      id: {
        type: DataTypes.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      product_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
    },
    {
      tableName: "category_products",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["category_id", "product_id"],
          name: "category_products_unique",
        },
        {
          fields: ["category_id"],
        },
        {
          fields: ["product_id"],
        },
      ],
    }
  );

  CategoryProduct.associate = function (models) {
    // Define associations
    CategoryProduct.belongsTo(models.categories, {
      foreignKey: "category_id",
      as: "category",
    });

    CategoryProduct.belongsTo(models.products, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return CategoryProduct;
};
