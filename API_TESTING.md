# TalentOS Backend API Testing Guide

## Quick Test Commands

### Health Check
```bash
curl http://localhost:5001/health
```

### Register Organization
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "admin@company.com",
    "password": "securepass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "organization": {
      "id": "cml...",
      "name": "My Company",
      "email": "admin@company.com"
    }
  },
  "message": "Organization registered successfully"
}
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "securepass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "organization": {
      "id": "cml...",
      "name": "My Company",
      "email": "admin@company.com"
    }
  },
  "message": "Login successful"
}
```

### Test Protected Endpoint (use token from register/login)
```bash
TOKEN="your_jwt_token_here"

curl http://localhost:5001/api/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

## Error Testing

### Invalid Email Format
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"notanemail","password":"test123"}'
```

**Expected:** 400 error with validation message

### Short Password
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"short"}'
```

**Expected:** 400 error (password must be 8+ chars)

### Duplicate Email
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"admin@company.com","password":"password123"}'
```

**Expected:** 409 error (email already exists)

### Wrong Password
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"wrongpassword"}'
```

**Expected:** 401 error (invalid credentials)

## Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "error message",
  "statusCode": 400
}
```

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Invalid Token
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error
