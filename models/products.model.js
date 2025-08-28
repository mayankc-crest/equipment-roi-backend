module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "products",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      quickbook_list_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      category_id: {
        type: DataTypes.BIGINT(20),
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "products",
    }
  );

  // Define associations
  Product.associate = (models) => {
    // Many-to-many relationship with categories through category_products junction table
    Product.belongsToMany(models.categories, {
      through: "category_products",
      foreignKey: "product_id",
      otherKey: "category_id",
      as: "categories",
    });

    // Keep the direct relationship for backward compatibility
    Product.belongsTo(models.categories, {
      foreignKey: "category_id",
      as: "category",
    });
  };

  return Product;
};
