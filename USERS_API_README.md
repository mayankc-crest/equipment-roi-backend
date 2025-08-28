# Users API Documentation

This document describes the Users API endpoints for the Customer Equipment ROI Application.

## Overview

The Users API provides comprehensive user management functionality including:

- **Create** new users
- **Read** user information with pagination and filtering
- **Update** existing users
- **Delete** users (soft delete)
- **Bulk operations** for multiple users
- **Statistics** and analytics

## Base URL

```
/api/users
```

## Authentication

All endpoints require:

- **JWT Token** in Authorization header: `Authorization: Bearer <token>`
- **Admin or Super** role permissions

## Endpoints

### 1. Create User

**POST** `/api/users`

Creates a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1-555-0123",
  "emergency_contact": "+1-555-9999",
  "notes": "User notes here",
  "street_address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "zip_code": "10001",
  "role": "sales representative",
  "is_active": true
}
```

**Required Fields:**

- `email` - User's email address (must be unique)
- `password` - User's password
- `first_name` - User's first name
- `last_name` - User's last name

**Optional Fields:**

- `phone_number` - User's phone number
- `emergency_contact` - User's emergency contact number
- `notes` - Additional notes about the user
- `street_address` - User's street address
- `city` - User's city
- `state` - User's state
- `country` - User's country
- `zip_code` - User's ZIP code
- `role` - User's role (default: "sales representative")
- `is_active` - Whether user account is active (default: true)

**Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "user@example.com",
      "role": "sales representative",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+1-555-0123",
      "emergency_contact": "+1-555-9999",
      "notes": "User notes here",
      "street_address": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "country": "United States",
      "zip_code": "10001",
      "is_active": true,
      "createdAt": "2025-08-19T18:00:00.000Z",
      "updatedAt": "2025-08-19T18:00:00.000Z"
    }
  }
}
```

### 2. Get All Users

**GET** `/api/users`

Retrieves all users with pagination and filtering.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Users per page (default: 10)
- `role` - Filter by role
- `is_active` - Filter by active status (true/false)
- `search` - Search in first name, last name, or email

**Example Requests:**

```
GET /api/users?page=1&limit=20
GET /api/users?role=sales representative
GET /api/users?is_active=true&search=john
GET /api/users?page=2&limit=5&role=admin
```

**Response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "super@admin.com",
        "role": "super",
        "first_name": "Super",
        "last_name": "Admin",
        "is_active": true,
        "createdAt": "2025-08-19T17:33:22.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "usersPerPage": 20
    }
  }
}
```

### 3. Get User by ID

**GET** `/api/users/:id`

Retrieves a specific user by their ID.

**Path Parameters:**

- `id` - User's unique identifier

**Example Request:**

```
GET /api/users/1
```

**Response (200):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "super@admin.com",
      "role": "super",
      "first_name": "Super",
      "last_name": "Admin",
      "phone_number": "+1-555-0123",
      "emergency_contact": "+1-555-9999",
      "notes": "Super administrator account with full access",
      "street_address": "123 Admin Street",
      "city": "Admin City",
      "state": "Admin State",
      "country": "United States",
      "zip_code": "12345",
      "is_active": true,
      "createdAt": "2025-08-19T17:33:22.000Z",
      "updatedAt": "2025-08-19T17:33:22.000Z"
    }
  }
}
```

### 4. Update User

**PUT** `/api/users/:id`

Updates an existing user's information.

**Path Parameters:**

- `id` - User's unique identifier

**Request Body:**

```json
{
  "first_name": "Updated Name",
  "phone_number": "+1-555-9999",
  "emergency_contact": "+1-555-8888",
  "notes": "Updated notes",
  "role": "admin",
  "is_active": false
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "user@example.com",
      "role": "admin",
      "first_name": "Updated Name",
      "last_name": "Doe",
      "phone_number": "+1-555-9999",
      "emergency_contact": "+1-555-8888",
      "notes": "Updated notes",
      "is_active": false,
      "updatedAt": "2025-08-19T18:30:00.000Z"
    }
  }
}
```

### 5. Delete User

**DELETE** `/api/users/:id`

Soft deletes a user (marks as deleted but preserves data).

**Path Parameters:**

- `id` - User's unique identifier

**Security Notes:**

- Cannot delete super users
- Performs soft delete (data is preserved)

**Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

### 6. Bulk Create Users

**POST** `/api/users/bulk`

Creates multiple users in a single request.

**Request Body:**

```json
{
  "users": [
    {
      "email": "user1@example.com",
      "password": "Password123!",
      "first_name": "John",
      "last_name": "Doe",
      "role": "sales representative"
    },
    {
      "email": "user2@example.com",
      "password": "Password456!",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "Data entry"
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Bulk user creation completed. 2 users created, 0 failed.",
  "data": {
    "createdUsers": [
      {
        "id": 3,
        "email": "user1@example.com",
        "role": "sales representative",
        "first_name": "John",
        "last_name": "Doe"
      },
      {
        "id": 4,
        "email": "user2@example.com",
        "role": "Data entry",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    ],
    "errors": [],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

### 7. Get User Statistics

**GET** `/api/users/stats`

Retrieves user statistics and analytics.

**Response (200):**

```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 5,
    "activeUsers": 4,
    "inactiveUsers": 1,
    "roleDistribution": {
      "super": 1,
      "admin": 1,
      "Data entry": 1,
      "sales representative": 2
    }
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Email, password, first name, and last name are required"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Cannot delete super users"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create user"
}
```

## Role-Based Access Control

### Available Roles

1. **super** - Full system access
2. **admin** - User management + admin features
3. **Data entry** - Data modification access
4. **sales representative** - Basic sales access (default)

### Permission Requirements

- **All endpoints**: Require admin or super role
- **Super users**: Cannot be deleted
- **Role assignment**: Can assign any role except super (admin only)

## Best Practices

1. **Password Security**: Always use strong passwords
2. **Role Assignment**: Assign minimal required permissions
3. **Data Validation**: Validate all input data
4. **Error Handling**: Implement proper error handling
5. **Audit Logging**: Log all user management operations
6. **Rate Limiting**: Implement rate limiting for bulk operations

## Testing

### Test User Creation

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "sales representative"
  }'
```

### Test Get All Users

```bash
curl -X GET "http://localhost:8000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Support

For issues or questions about the Users API:

1. Check authentication and role permissions
2. Verify request body format
3. Check server logs for detailed error messages
4. Ensure database connection is working
