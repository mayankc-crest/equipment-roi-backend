module.exports = (sequelize, DataTypes) => {
  const InvoiceLineItem = sequelize.define(
    "invoice_line_items",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      invoice_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      line_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Line number/position in the invoice",
      },
      product_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        comment: "Reference to products table",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Quantity of the item",
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Unit price of the item",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total amount for this line (quantity * unit_price)",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "invoice_line_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Define associations
  InvoiceLineItem.associate = (models) => {
    InvoiceLineItem.belongsTo(models.invoices, {
      foreignKey: "invoice_id",
      as: "invoice",
    });

    InvoiceLineItem.belongsTo(models.products, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return InvoiceLineItem;
};
