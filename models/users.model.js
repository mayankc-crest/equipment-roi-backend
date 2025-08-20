module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("super", "admin", "user"),
        defaultValue: "user",
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING(20),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      street_address: {
        type: DataTypes.STRING(255),
      },
      city: {
        type: DataTypes.STRING(100),
      },
      state: {
        type: DataTypes.STRING(100),
      },
      country: {
        type: DataTypes.STRING(100),
      },
      zip_code: {
        type: DataTypes.STRING(20),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: DataTypes.DATE,
      },
      password_reset_token: {
        type: DataTypes.STRING(255),
      },
      password_reset_expires: {
        type: DataTypes.DATE,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
      ],
    }
  );

  return User;
};
