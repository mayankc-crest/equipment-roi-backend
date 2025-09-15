"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("alerts", {
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
      alert_type: {
        type: Sequelize.ENUM("3_year_review"),
        allowNull: false,
        defaultValue: "3_year_review",
        comment: "Type of alert (3_year_review, etc.)",
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Soft delete timestamp",
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("alerts", ["customer_id"], {
      name: "idx_alerts_customer_id",
    });

    await queryInterface.addIndex("alerts", ["alert_type"], {
      name: "idx_alerts_alert_type",
    });

    await queryInterface.addIndex("alerts", ["deleted_at"], {
      name: "idx_alerts_deleted_at",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex("alerts", "idx_alerts_customer_id");
    await queryInterface.removeIndex("alerts", "idx_alerts_alert_type");
    await queryInterface.removeIndex("alerts", "idx_alerts_deleted_at");

    // Drop the table
    await queryInterface.dropTable("alerts");
  },
};
