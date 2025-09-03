"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("calc_roi", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to customers table",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Add index for better performance
    await queryInterface.addIndex("calc_roi", ["customer_id"], {
      name: "idx_calc_roi_customer_id",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("calc_roi");
  },
};
