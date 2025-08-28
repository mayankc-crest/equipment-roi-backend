"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("category_products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT(20),
      },
      category_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Add unique constraint to prevent duplicate category-product combinations
    await queryInterface.addIndex(
      "category_products",
      ["category_id", "product_id"],
      {
        unique: true,
        name: "category_products_unique",
      }
    );

    // Add individual indexes for better query performance
    await queryInterface.addIndex("category_products", ["category_id"]);
    await queryInterface.addIndex("category_products", ["product_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("category_products");
  },
};
