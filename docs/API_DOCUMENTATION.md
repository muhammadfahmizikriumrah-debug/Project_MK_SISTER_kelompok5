# API Documentation - taskThink

## Base URL
```
http://localhost:8080
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Auth Service Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "user"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### GET /api/auth/verify
Verify current token (Protected).

### GET /api/auth/me
Get current user info (Protected).

## Portfolio Service Endpoints

### GET /api/portfolios
Get all portfolios with pagination and filters.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search in title/description
- `tags` - Filter by tags (comma-separated)
- `category` - Filter by category
- `status` - Filter by status (draft/published/archived)

### GET /api/portfolios/:id
Get portfolio by ID.

### GET /api/portfolios/user/:userId
Get portfolios by user ID.

### GET /api/portfolios/public/:username
Get public portfolios by username.

### POST /api/portfolios
Create new portfolio (Protected).

**Request Body:**
```json
{
  "userId": "user_uuid",
  "title": "Portfolio Title",
  "description": "Portfolio description",
  "tags": ["tag1", "tag2"],
  "category": "Research",
  "status": "published",
  "isPublic": true,
  "technologies": ["React", "Node.js"]
}
```

### PUT /api/portfolios/:id
Update portfolio (Protected).

### DELETE /api/portfolios/:id
Delete portfolio (Protected).

### POST /api/portfolios/:id/view
Increment view count.

### POST /api/portfolios/:id/like
Toggle like/unlike.

**Request Body:**
```json
{
  "action": "like" // or "unlike"
}
```

## Media Service Endpoints

### POST /api/media/upload
Upload file (Protected).

**Form Data:**
- `file` - File to upload
- `userId` - User ID

### GET /api/media/:id
Get media by ID.

### GET /api/media/user/:userId
Get media by user ID.

### DELETE /api/media/:id
Delete media (Protected).

## Search Service Endpoints

### GET /api/search/portfolios
Search portfolios.

**Query Parameters:**
- `q` - Search query (required)
- `limit` (default: 20)
- `offset` (default: 0)
- `tags` - Filter by tags
- `category` - Filter by category
- `sort` - Sort by (relevance/date/views/likes)

### GET /api/search/suggestions
Get search suggestions.

**Query Parameters:**
- `q` - Query string
- `limit` (default: 5)

## Profile Service Endpoints

### GET /api/profiles/user/:userId
Get profile by user ID.

### GET /api/profiles/public/:username
Get public profile by username.

### POST /api/profiles
Create profile.

### PUT /api/profiles/:userId
Update profile.

### DELETE /api/profiles/:userId
Delete profile.

### POST /api/profiles/:userId/view
Increment profile view count.

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field error message"
    }
  ]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
