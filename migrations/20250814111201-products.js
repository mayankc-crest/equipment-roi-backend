"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      quickbook_list_id: { type: Sequelize.STRING(50) },
      name: { type: Sequelize.STRING(100) },
      full_name: { type: Sequelize.STRING(150) },
      description: { type: Sequelize.TEXT },
      price: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      account_name: { type: Sequelize.STRING(150) },
      category_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });

    // Add index for category_id for better query performance
    await queryInterface.addIndex("products", ["category_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("products");
  },
};
