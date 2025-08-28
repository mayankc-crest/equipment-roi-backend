"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("calc_invoices", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      invoice_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      route_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "routes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sales_rep_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to users table (sales representative)",
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
      product_type: {
        type: Sequelize.ENUM("New", "Used"),
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total amount of the invoice",
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

    // Add indexes for better performance
    await queryInterface.addIndex("calc_invoices", ["invoice_id"], {
      unique: true,
    });
    await queryInterface.addIndex("calc_invoices", ["route_id"]);
    await queryInterface.addIndex("calc_invoices", ["sales_rep_id"], {
      name: "idx_calc_invoices_sales_rep_id",
    });
    await queryInterface.addIndex("calc_invoices", ["category_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("calc_invoices");
  },
};
