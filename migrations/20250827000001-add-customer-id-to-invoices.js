"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("invoices", "customer_id", {
      type: Sequelize.BIGINT(20),
      allowNull: true,
      references: {
        model: "customers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Reference to customers table",
    });
    await queryInterface.addIndex("invoices", ["customer_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("invoices", "customer_id");
  },
};
