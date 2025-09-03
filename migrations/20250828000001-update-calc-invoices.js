"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if roi_id column exists before adding
    const tableDescription = await queryInterface.describeTable(
      "calc_invoices"
    );

    if (!tableDescription.roi_id) {
      await queryInterface.addColumn("calc_invoices", "roi_id", {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to calc_roi table",
      });
    } else {
      console.log("Column roi_id already exists, skipping addition");
    }

    // Check if customer_id column exists before adding
    if (!tableDescription.customer_id) {
      await queryInterface.addColumn("calc_invoices", "customer_id", {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to customers table",
      });
    } else {
      console.log("Column customer_id already exists, skipping addition");
    }

    // Remove category_id column (since it's commented out in the model)
    if (tableDescription.category_id) {
      await queryInterface.removeColumn("calc_invoices", "category_id");
    } else {
      console.log("Column category_id does not exist, skipping removal");
    }

    // Remove product_type column (since it's commented out in the model)
    if (tableDescription.product_type) {
      await queryInterface.removeColumn("calc_invoices", "product_type");
    } else {
      console.log("Column product_type does not exist, skipping removal");
    }

    // Add indexes for new columns (only if they don't exist)
    try {
      await queryInterface.addIndex("calc_invoices", ["roi_id"], {
        name: "idx_calc_invoices_roi_id",
      });
    } catch (error) {
      console.log("Index idx_calc_invoices_roi_id already exists, skipping");
    }

    try {
      await queryInterface.addIndex("calc_invoices", ["customer_id"], {
        name: "idx_calc_invoices_customer_id",
      });
    } catch (error) {
      console.log(
        "Index idx_calc_invoices_customer_id already exists, skipping"
      );
    }

    // Remove the old category_id index since we removed the column (if it exists)
    try {
      await queryInterface.removeIndex("calc_invoices", ["category_id"]);
    } catch (error) {
      console.log(
        "Index calc_invoices_category_id does not exist, skipping removal"
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new columns
    await queryInterface.removeColumn("calc_invoices", "roi_id");
    await queryInterface.removeColumn("calc_invoices", "customer_id");

    // Add back the removed columns
    await queryInterface.addColumn("calc_invoices", "category_id", {
      type: Sequelize.BIGINT(20),
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addColumn("calc_invoices", "product_type", {
      type: Sequelize.ENUM("New", "Used"),
      allowNull: false,
    });

    // Remove new indexes
    await queryInterface.removeIndex("calc_invoices", ["roi_id"]);
    await queryInterface.removeIndex("calc_invoices", ["customer_id"]);

    // Add back the category_id index
    try {
      await queryInterface.addIndex("calc_invoices", ["category_id"]);
    } catch (error) {
      console.log("Could not add category_id index, it may already exist");
    }
  },
};
