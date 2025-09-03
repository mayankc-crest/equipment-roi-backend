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
      roi_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      customer_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "customers",
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
      // category_id: {
      //   type: DataTypes.BIGINT(20),
      //   allowNull: false,
      //   references: {
      //     model: "categories",
      //     key: "id",
      //   },
      //   onUpdate: "CASCADE",
      //   onDelete: "CASCADE",
      // },
      // product_type: {
      //   type: ENUM("New", "Used"),
      //   allowNull: false,
      // },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total amount of the invoice",
      },
    },
    {
      timestamps: true,
      tableName: "calc_invoices",
      freezeTableName: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["roi_id"],
        },
        {
          fields: ["invoice_id"],
          unique: true,
        },
        {
          fields: ["customer_id"],
        },
        {
          fields: ["route_id"],
        },
        {
          fields: ["sales_rep_id"],
        },
      ],
    }
  );

  // Define associations
  CalcInvoices.associate = (models) => {
    // Temporarily comment out associations to debug
    /*
    CalcInvoices.belongsTo(models.calc_roi, {
      foreignKey: "roi_id",
      as: "roi",
    });

    CalcInvoices.belongsTo(models.invoices, {
      foreignKey: "invoice_id",
      as: "invoice",
    });

    CalcInvoices.belongsTo(models.customers, {
      foreignKey: "customer_id",
      as: "customer",
    });

    CalcInvoices.belongsTo(models.routes, {
      foreignKey: "route_id",
      as: "route",
    });

    CalcInvoices.belongsTo(models.users, {
      foreignKey: "sales_rep_id",
      as: "salesRep",
    });

    CalcInvoices.hasMany(models.calc_invoice_line_items, {
      foreignKey: "calc_invoice_id",
      as: "lineItems",
    });
    */
  };

  return CalcInvoices;
};
