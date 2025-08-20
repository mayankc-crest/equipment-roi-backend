"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("super@123", saltRounds);

    await queryInterface.bulkInsert(
      "users",
      [
        {
          email: "super@admin.com",
          password: hashedPassword,
          role: "super",
          first_name: "Super",
          last_name: "Admin",
          phone_number: "+1-555-0123",
          notes: "Super administrator account with full access",
          street_address: "123 Admin Street",
          city: "Admin City",
          state: "Admin State",
          country: "United States",
          zip_code: "12345",
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", { email: "super@admin.com" }, {});
  },
};
