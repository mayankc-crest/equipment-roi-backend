module.exports = (sequelize, DataTypes) => {
  const CalcInvoiceLineItems = sequelize.define(
    "calc_invoice_line_items",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      calc_invoice_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_invoices",
          key: "id",
        },
      },
      line_item_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "invoice_line_items",
          key: "id",
        },
      },
      product_condition: {
        type: DataTypes.ENUM("New", "Used"),
        allowNull: false,
        defaultValue: "New",
        comment: "Condition of the product",
      },
      sale_type: {
        type: DataTypes.ENUM("sold", "lease"),
        allowNull: false,
        defaultValue: "lease",
        comment: "Type of sale",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Quantity of the item",
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Price of the item",
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total price of the item",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Creation timestamp",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Last update timestamp",
      },
    },
    {
      tableName: "calc_invoice_line_items",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Define associations
  CalcInvoiceLineItems.associate = (models) => {
    CalcInvoiceLineItems.belongsTo(models.calc_invoices, {
      foreignKey: "calc_invoice_id",
      as: "calcInvoice",
    });

    CalcInvoiceLineItems.belongsTo(models.invoice_line_items, {
      foreignKey: "line_item_id",
      as: "lineItem",
    });
  };

  return CalcInvoiceLineItems;
};
