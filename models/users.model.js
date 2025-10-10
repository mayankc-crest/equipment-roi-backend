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
        type: DataTypes.ENUM(
          "super",
          "admin",
          "Data entry",
          "sales representative"
        ),
        defaultValue: "sales representative",
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
      emergency_contact: {
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
      profile_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isValidImageUrl(value) {
            if (value === null || value === undefined) return true; // Allow null/undefined
            if (typeof value !== "string") return false;

            // Allow both full URLs and relative paths
            const isFullUrl = /^https?:\/\//.test(value);
            const isRelativePath = /^\/uploads\/profiles\//.test(value);

            if (!isFullUrl && !isRelativePath) {
              throw new Error(
                "Profile image URL must be a valid URL or relative path starting with /uploads/profiles/"
              );
            }
          },
        },
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
