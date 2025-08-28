const { ENUM } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const CalcInvoices = sequelize.define(
    "calc_invoices",
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
      route_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "routes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sales_rep_id: {
        type: DataTypes.BIGINT(20),
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
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_type: {
        type: ENUM("New", "Used"),
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total amount of the invoice",
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ["invoice_id"],
          unique: true,
        },
        {
          fields: ["route_id"],
        },
        {
          fields: ["sales_rep_id"],
        },
        {
          fields: ["category_id"],
        },
      ],
    }
  );

  // Define associations
  CalcInvoices.associate = (models) => {
    CalcInvoices.belongsTo(models.invoices, {
      foreignKey: "invoice_id",
      as: "invoice",
    });

    CalcInvoices.belongsTo(models.routes, {
      foreignKey: "route_id",
      as: "route",
    });

    CalcInvoices.belongsTo(models.users, {
      foreignKey: "sales_rep_id",
      as: "salesRep",
    });

    CalcInvoices.belongsTo(models.categories, {
      foreignKey: "category_id",
      as: "category",
    });

    CalcInvoices.hasMany(models.calc_invoice_line_items, {
      foreignKey: "calc_invoice_id",
      as: "lineItems",
    });
  };

  return CalcInvoices;
};
