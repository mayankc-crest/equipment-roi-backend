module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "invoices",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      quickbook_list_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "QuickBooks ListID for syncing",
      },
      txn_id: {
        type: DataTypes.STRING(50),
        allowNull: true, // Changed to true - not always provided by QuickBooks
        comment: "QuickBooks Transaction ID (optional)",
      },
      txn_number: {
        type: DataTypes.INTEGER,
        allowNull: true, // Changed to true - not always provided by QuickBooks
        comment: "QuickBooks Transaction Number (optional)",
      },
      customer_list_id: {
        type: DataTypes.STRING(50),
        allowNull: true, // Changed to true - can be empty for some invoices
        comment: "QuickBooks Customer List ID",
      },
      customer_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
        comment: "Customer name from QuickBooks",
      },
      customer_full_name: {
        type: DataTypes.STRING(150),
        allowNull: true, // Changed to true - can be empty
        comment: "Customer full name from QuickBooks",
      },
      customer_id: {
        type: DataTypes.BIGINT(20),
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Reference to customers table",
      },
      txn_date: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Changed to true - can be empty
        comment: "Transaction date from QuickBooks",
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Invoice due date from QuickBooks",
      },
      ref_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Invoice reference number",
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: true, // Changed to true - can be 0 or empty
      },
      sales_tax_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: true, // Changed to true - can be 0 or empty
      },
      sales_tax_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: true, // Changed to true - can be 0 or empty
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: true, // Changed to true - can be 0 or empty
      },
      balance_remaining: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: true, // Changed to true - can be 0 or empty
      },
      is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true, // Changed to true - can be null
      },
      memo: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Invoice memo/notes from QuickBooks",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true, // Changed to true - can be null
        comment: "Whether the invoice is active in QuickBooks",
      },
      is_calculated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Flag to indicate invoice is included in ROI calculation",
      },
      is_sync_calculated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Flag to indicate invoice sync calculation status",
      },
    },
    {
      timestamps: true, // Changed to true to enable Sequelize timestamps
      indexes: [
        {
          fields: ["quickbook_list_id"],
          unique: true,
        },
        {
          fields: ["customer_list_id"],
        },
        {
          fields: ["customer_id"],
        },
        {
          fields: ["txn_date"],
        },
        {
          fields: ["ref_number"],
        },
      ],
    }
  );

  // Define associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.customers, {
      foreignKey: "customer_id",
      as: "customer",
    });

    Invoice.hasMany(models.invoice_line_items, {
      foreignKey: "invoice_id",
      as: "lineItems",
    });
  };

  return Invoice;
};
