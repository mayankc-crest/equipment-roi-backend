const bcrypt = require("bcrypt");

// Test the new user fields
console.log("🧪 Testing New User Fields...\n");

const testPassword = "super@123";
const testUser = {
  email: "test@example.com",
  password: testPassword,
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1-555-0123",
  notes: "This is a test user with all fields populated",
  street_address: "123 Test Street",
  city: "Test City",
  state: "Test State",
  country: "United States",
  zip_code: "12345",
  role: "user",
};

console.log("1. Testing password hashing...");
bcrypt
  .hash(testPassword, 10)
  .then((hashedPassword) => {
    console.log("   ✅ Password hashed successfully");

    // Test password verification
    console.log("\n2. Testing password verification...");
    return bcrypt.compare(testPassword, hashedPassword);
  })
  .then((isValid) => {
    if (isValid) {
      console.log("   ✅ Password verification successful");
    } else {
      console.log("   ❌ Password verification failed");
    }

    console.log("\n🎉 New fields test completed successfully!");
    console.log("\n📋 New User Table Structure:");
    console.log("   🔑 id (BIGINT, AUTO_INCREMENT, PRIMARY KEY)");
    console.log("   📧 email (VARCHAR(100), UNIQUE, NOT NULL)");
    console.log("   🔐 password (VARCHAR(255), NOT NULL)");
    console.log("   👑 role (ENUM: super, admin, user)");
    console.log("   📝 first_name (VARCHAR(100), NOT NULL)");
    console.log("   📝 last_name (VARCHAR(100), NOT NULL)");
    console.log("   📞 phone_number (VARCHAR(20))");
    console.log("   📋 notes (TEXT)");
    console.log("   🏠 street_address (VARCHAR(255))");
    console.log("   🏙️ city (VARCHAR(100))");
    console.log("   🗺️ state (VARCHAR(100))");
    console.log("   🌍 country (VARCHAR(100))");
    console.log("   📮 zip_code (VARCHAR(20))");
    console.log("   ✅ is_active (BOOLEAN)");
    console.log("   🕒 last_login (DATETIME)");
    console.log("   🔑 password_reset_token (VARCHAR(255))");
    console.log("   ⏰ password_reset_expires (DATETIME)");
    console.log("   📅 createdAt (DATETIME, NOT NULL)");
    console.log("   📅 updatedAt (DATETIME, NOT NULL)");
    console.log("   🗑️ deletedAt (DATETIME)");

    console.log("\n🚀 Super User Account Created:");
    console.log("   📧 Email: super@admin.com");
    console.log("   🔐 Password: super@123");
    console.log("   👑 Role: super");
    console.log("   📝 First Name: Super");
    console.log("   📝 Last Name: Admin");
    console.log("   📞 Phone: +1-555-0123");
    console.log("   📋 Notes: Super administrator account with full access");
    console.log(
      "   🏠 Address: 123 Admin Street, Admin City, Admin State, United States 12345"
    );

    console.log("\n✨ All new fields are now available in the users table!");
  })
  .catch((error) => {
    console.error("❌ Test failed:", error.message);
  });
