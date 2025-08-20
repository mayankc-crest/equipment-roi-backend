module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "invoices",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      txn_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      txn_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_list_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customer_full_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      txn_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      ref_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      sales_tax_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      sales_tax_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      balance_remaining: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      is_paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
    }
  );

  return Invoice;
};
