module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "products",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      quickbook_list_id: { type: DataTypes.STRING(50) }, // From ListID
      name: { type: DataTypes.STRING(100) }, // Short name
      full_name: { type: DataTypes.STRING(150) }, // Full name
      description: { type: DataTypes.TEXT }, // From SalesOrPurchase.Desc
      price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 }, // From SalesOrPurchase.Price
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }, // From IsActive
      account_name: { type: DataTypes.STRING(150) }, // From AccountRef.FullName
    },
    {
      timestamps: true,
    }
  );

  return Product;
};
