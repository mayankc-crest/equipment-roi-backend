"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("invoices", "quickbook_list_id", {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      after: "id",
      comment: "QuickBooks ListID for syncing",
    });

    await queryInterface.addColumn("invoices", "customer_name", {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: "customer_list_id",
      comment: "Customer name from QuickBooks",
    });

    await queryInterface.addColumn("invoices", "due_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: "txn_date",
      comment: "Invoice due date from QuickBooks",
    });

    await queryInterface.addColumn("invoices", "memo", {
      type: Sequelize.TEXT,
      allowNull: true,
      after: "is_paid",
      comment: "Invoice memo/notes from QuickBooks",
    });

    await queryInterface.addColumn("invoices", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: "memo",
      comment: "Whether the invoice is active in QuickBooks",
    });

    await queryInterface.addColumn("invoices", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      after: "is_active",
    });

    await queryInterface.addColumn("invoices", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      after: "created_at",
    });

    // Add indexes for better performance
    await queryInterface.addIndex("invoices", ["quickbook_list_id"], {
      unique: true,
      name: "invoices_quickbook_list_id_unique",
    });

    await queryInterface.addIndex("invoices", ["customer_list_id"], {
      name: "invoices_customer_list_id_idx",
    });

    await queryInterface.addIndex("invoices", ["txn_date"], {
      name: "invoices_txn_date_idx",
    });

    await queryInterface.addIndex("invoices", ["ref_number"], {
      name: "invoices_ref_number_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex(
      "invoices",
      "invoices_quickbook_list_id_unique"
    );
    await queryInterface.removeIndex(
      "invoices",
      "invoices_customer_list_id_idx"
    );
    await queryInterface.removeIndex("invoices", "invoices_txn_date_idx");
    await queryInterface.removeIndex("invoices", "invoices_ref_number_idx");

    // Remove columns
    await queryInterface.removeColumn("invoices", "updated_at");
    await queryInterface.removeColumn("invoices", "created_at");
    await queryInterface.removeColumn("invoices", "is_active");
    await queryInterface.removeColumn("invoices", "memo");
    await queryInterface.removeColumn("invoices", "due_date");
    await queryInterface.removeColumn("invoices", "customer_name");
    await queryInterface.removeColumn("invoices", "quickbook_list_id");
  },
};
