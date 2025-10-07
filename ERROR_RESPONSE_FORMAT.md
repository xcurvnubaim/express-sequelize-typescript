# Error Response Format

This document describes the standardized error response format used throughout the API.

## Response Structure

All error responses follow this structure:

```typescript
{
  "success": false,
  "message": string,           // Human-readable error message
  "data": null,                // Always null for errors
  "error": {
    "statusCode": number,      // HTTP status code
    "message": string,         // Same as top-level message
    "stackFrames": Array<{     // Stack trace (dev/staging only)
      "fn": string,            // Function name
      "file": string,          // File path (relative)
      "line": number,          // Line number
      "column": number,        // Column number (optional)
      "nodeModule": boolean,   // Is from node_modules
      "nodeInternal": boolean  // Is Node.js internal
    }>
  }
}
```

## Example Error Responses

### 1. Validation Error (Query Parameters)

**Request:**
```
GET /api/posts?as[equals]=test
```

**Response:**
```json
{
  "success": false,
  "message": "Failed to validate request: filtering not allowed on field \"as\" with operator \"equals\"",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Failed to validate request: filtering not allowed on field \"as\" with operator \"equals\"",
    "stackFrames": [
      {
        "fn": "validateQueryParams",
        "file": "src/lib/query/queryValidator.ts",
        "line": 227,
        "column": 11,
        "nodeModule": false,
        "nodeInternal": false
      },
      {
        "fn": "listPosts",
        "file": "src/controllers/post.controller.ts",
        "line": 33,
        "column": 9,
        "nodeModule": false,
        "nodeInternal": false
      },
      {
        "fn": "wrap",
        "file": "src/controllers/base.controller.ts",
        "line": 9,
        "column": 29,
        "nodeModule": false,
        "nodeInternal": false
      }
      // ... more frames (node_modules filtered by default)
    ]
  }
}
```

### 2. Resource Not Found

**Request:**
```
GET /api/posts/99999
```

**Response:**
```json
{
  "success": false,
  "message": "Post not found",
  "data": null,
  "error": {
    "statusCode": 404,
    "message": "Post not found",
    "stackFrames": [
      {
        "fn": "getPostById",
        "file": "src/controllers/post.controller.ts",
        "line": 48,
        "column": 20,
        "nodeModule": false,
        "nodeInternal": false
      }
      // ...
    ]
  }
}
```

### 3. Schema Validation Error (Zod)

**Request:**
```
POST /api/posts
Content-Type: application/json

{
  "title": ""
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "stackFrames": [
      {
        "fn": "createPost",
        "file": "src/controllers/post.controller.ts",
        "line": 72,
        "column": 32,
        "nodeModule": false,
        "nodeInternal": false
      }
      // ...
    ]
  }
}
```

### 4. Database Error

**Response:**
```json
{
  "success": false,
  "message": "Database validation failed",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Database validation failed",
    "stackFrames": [
      {
        "fn": "create",
        "file": "src/repositories/base.repository.ts",
        "line": 38,
        "column": 22,
        "nodeModule": false,
        "nodeInternal": false
      }
      // ...
    ]
  }
}
```

### 5. Internal Server Error

**Response:**
```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "data": null,
  "error": {
    "statusCode": 500,
    "message": "Internal server error",
    "stackFrames": [
      // Stack frames (only in development)
    ]
  }
}
```

## Environment-Specific Behavior

### Development & Staging
- **stackFrames** are included in the response
- Shows detailed error messages
- Includes all stack trace information

### Production
- **stackFrames** are **NOT** included (for security)
- Generic error messages for 500 errors
- Sensitive information is hidden

## HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| 400 | Bad Request | Validation errors, invalid query parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, constraint violation |
| 422 | Unprocessable Entity | Valid syntax but semantically incorrect |
| 500 | Internal Server Error | Unexpected server errors |

## Query Parameter Validation Errors

The query validation system validates:

1. **Sorting**
   - Only whitelisted columns can be sorted
   - Only 'asc' or 'desc' directions allowed

2. **Filtering**
   - Filters must be on allowed fields
   - Operators must be allowed for that field
   - Values must match expected types

3. **Search**
   - Search columns must be whitelisted
   - Search term must be provided

4. **Pagination**
   - Page size is clamped to min/max values
   - Page number must be positive

### Validation Error Message Format

```
"Failed to validate request: <specific error>"
```

Examples:
- `"Failed to validate request: filtering not allowed on field \"as\" with operator \"equals\""`
- `"Failed to validate request: Invalid sort column: invalid_column"`
- `"Failed to validate request: Invalid search columns: bad_col1, bad_col2"`

## Implementation Details

### Creating Custom Errors

```typescript
import { ApiErrorClass } from './lib/errors/api-error';

// Basic error
throw new ApiErrorClass('Resource not found', 404);

// With additional context
throw new ApiErrorClass('Validation failed', 400, {
  context: { field: 'email', reason: 'invalid format' }
});
```

### Stack Frame Filtering

Stack frames are automatically filtered to:
- Remove Node.js internals (unless explicitly enabled)
- Mark node_modules frames
- Use relative paths from project root
- Include function names and locations

### Configuration

Control stack frame behavior:

```typescript
new ApiErrorClass('Error message', 500, {
  stackOptions: {
    includeNodeInternals: true,  // Include Node.js internal frames
    includeNodeModules: false,   // Exclude node_modules
  }
});
```

## Testing Error Responses

### cURL Examples

```bash
# Test invalid filter
curl "http://localhost:3000/api/posts?invalid[equals]=test"

# Test invalid sort column
curl "http://localhost:3000/api/posts?sortBy=invalid_column"

# Test not found
curl "http://localhost:3000/api/posts/99999"

# Test validation error
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

### Expected Responses

All error responses will:
1. Have `success: false`
2. Include a descriptive `message`
3. Have `data: null`
4. Include an `error` object with `statusCode` and `message`
5. In non-production: include `stackFrames` array

## Additional Notes

- All errors are logged server-side with full details
- Client responses are sanitized to prevent information leakage
- Stack traces help debugging without exposing server internals in production
- The response format is consistent across all endpoints
