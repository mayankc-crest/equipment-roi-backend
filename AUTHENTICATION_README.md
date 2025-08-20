# JWT Authentication System

This document describes the JWT authentication system implemented for the Customer Equipment ROI Application.

## Overview

The application now uses JWT (JSON Web Tokens) for secure authentication instead of simple username/password matching. This provides:

- **Secure token-based authentication**
- **Role-based access control**
- **Password hashing with bcrypt**
- **Protected API endpoints**
- **User management system**

## Database Changes

### New Users Table

The `users` table has been created with the following structure:

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super', 'admin', 'user') DEFAULT 'user',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  notes TEXT,
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME,
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  deletedAt DATETIME
);
```

### Super User Account

A super user account has been created with:

- **Email**: `super@admin.com`
- **Password**: `super@123`
- **Role**: `super`

## API Endpoints

### Public Routes (No Authentication Required)

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1-555-0123",
  "notes": "User notes here",
  "street_address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "zip_code": "10001",
  "role": "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### Protected Routes (Authentication Required)

All protected routes require the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

#### GET `/api/auth/profile`

Get current user's profile information.

#### PUT `/api/auth/profile`

Update current user's profile.

**Request Body:**

```json
{
  "first_name": "Updated Name",
  "last_name": "Updated Last",
  "email": "newemail@example.com",
  "phone_number": "+1-555-9999",
  "notes": "Updated notes",
  "street_address": "456 New Street",
  "city": "Los Angeles",
  "state": "CA",
  "country": "United States",
  "zip_code": "90210"
}
```

#### POST `/api/auth/change-password`

Change user's password.

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### POST `/api/auth/logout`

Logout (client-side token removal).

### Admin Routes

#### GET `/api/auth/users`

Get all users (admin and super users only).

## Authentication Middleware

### Usage

```javascript
const AuthMiddleware = require("./middleware/auth.middleware");

// Protect a route
router.get("/protected", AuthMiddleware.verifyToken, (req, res) => {
  // Route logic here
});

// Require specific role
router.get(
  "/admin-only",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin,
  (req, res) => {
    // Admin only logic
  }
);

// Require super user
router.get(
  "/super-only",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireSuper,
  (req, res) => {
    // Super user only logic
  }
);
```

### Available Middleware Functions

- `verifyToken` - Verifies JWT token and attaches user to request
- `requireRole(roles)` - Checks if user has required role(s)
- `requireAdmin` - Checks if user is admin or super
- `requireSuper` - Checks if user is super user
- `optionalAuth` - Optionally attaches user if token exists

## Security Features

### Password Hashing

- Passwords are hashed using bcrypt with 10 salt rounds
- Original passwords are never stored in the database

### JWT Security

- Tokens expire after 24 hours (configurable)
- Secret key should be changed in production
- Tokens are verified on every protected request

### Role-Based Access Control

- **super**: Full access to all features
- **admin**: Access to admin features and user management
- **user**: Basic access to user features

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h
```

## Testing

### Run JWT Tests

```bash
node test-auth.js
```

### Run API Tests (requires server running)

```bash
node test-api.js
```

## Database Setup

### Run Migrations

```bash
npx sequelize-cli db:migrate
```

### Run Seeders

```bash
npx sequelize-cli db:seed:all
```

## Migration from Old System

1. **Database**: The new users table is separate from any existing authentication
2. **API**: Old endpoints can be gradually migrated to use JWT authentication
3. **Frontend**: Update to send JWT tokens in Authorization headers

## Best Practices

1. **Always use HTTPS in production**
2. **Change JWT_SECRET in production**
3. **Implement token refresh mechanism for long sessions**
4. **Add rate limiting for authentication endpoints**
5. **Log authentication events for security monitoring**
6. **Implement password complexity requirements**
7. **Add account lockout after failed attempts**

## Troubleshooting

### Common Issues

1. **"Access token required"** - Missing or malformed Authorization header
2. **"Token expired"** - JWT token has expired, user needs to login again
3. **"Invalid token"** - JWT token is malformed or invalid
4. **"Insufficient permissions"** - User doesn't have required role

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=jwt:*
```

## Support

For issues or questions about the authentication system, check:

1. JWT token format in Authorization header
2. Database connection and user table
3. Environment variables configuration
4. Server logs for detailed error messages
