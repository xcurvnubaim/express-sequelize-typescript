# Validation and Error Handling Guide

## Overview

This application uses **Zod** for inline validation in controllers and a **global error handler** middleware to handle all errors consistently.

## Architecture

```
Request → Route → Controller (validates with Zod) → Service → Repository → Database
                      ↓ (if error occurs)
                  Error Handler → Formatted Response
```

## Validation in Controllers

Validation is done **inline in controllers** using Zod schemas. This keeps the validation logic close to where it's used and reduces complexity.

### Example: User Controller

```typescript
import { z } from 'zod';

// Define validation schemas at the top of the controller
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Invalid email format').max(255),
});

const updateUserSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
});

// Use in controller methods
createUser = this.asyncHandler(async (req: Request, res: Response) => {
    // Validation happens here - throws ZodError if invalid
    const validatedData = createUserSchema.parse(req.body);
    
    const user = await this.userService.createUser(validatedData);
    this.sendSuccess(res, user, 201);
});
```

### Benefits of Inline Validation

✅ **Co-location** - Validation logic is right next to the controller method  
✅ **Simplicity** - No separate validation files or middleware to manage  
✅ **Type Safety** - Zod provides full TypeScript type inference  
✅ **Clear Errors** - Validation errors are automatically caught by error handler  

## Global Error Handler

The global error handler catches **all errors** from async controllers and provides consistent error responses.

### Error Handler Features

1. **API Errors** - Custom `ApiErrorClass` with status codes
2. **Validation Errors** - Zod validation errors (ZodError)
3. **Sequelize Errors** - Database validation and constraint errors
4. **JWT Errors** - Authentication/token errors
5. **404 Errors** - Not found errors
6. **Generic Errors** - All other errors

### Error Response Format

All errors return the same format:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Detailed error message",
    "stack": "Error stack (development only)"
  },
  "errorStack": [
    // Chain of errors if applicable
  ]
}
```

## Error Handling Examples

### 1. Validation Error (Automatic)

When Zod validation fails:

```typescript
// Request: POST /api/users
// Body: { "name": "", "email": "invalid" }

// Response: 400 Bad Request
{
  "success": false,
  "message": "Validation error: name String must contain at least 1 character(s), email Invalid email format",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Validation error: ..."
  }
}
```

### 2. Not Found Error

```typescript
// Request: GET /api/users/99999

// Response: 404 Not Found
{
  "success": false,
  "message": "User not found",
  "data": null,
  "error": {
    "statusCode": 404,
    "message": "User not found"
  }
}
```

### 3. Database Error (Automatic)

```typescript
// Duplicate email (unique constraint)
// Response: 400 Bad Request
{
  "success": false,
  "message": "Database validation error",
  "data": null,
  "error": {
    "statusCode": 400,
    "message": "Database validation failed"
  }
}
```

### 4. Custom Error in Service

```typescript
// In service layer
if (!user) {
    throw new ApiErrorClass('User not found', 404);
}

// Caught by global error handler and formatted
```

## Middleware Stack POST

**Important**: POST matters in Express!

```typescript
// 1. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Health check (before other routes)
app.get('/health', ...);

// 3. API Routes
app.use('/api/users', createUserRoutes());
app.use('/api/posts', createPostRoutes());

// 4. 404 handler (after all routes)
app.use(notFoundHandler);

// 5. Global error handler (MUST BE LAST!)
app.use(globalErrorHandler);
```

## Controller Validation Patterns

### Pattern 1: Simple Validation

```typescript
const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});

myMethod = this.asyncHandler(async (req, res) => {
    const data = schema.parse(req.body);
    // Use validated data
});
```

### Pattern 2: Validation + Custom Logic

```typescript
updateUser = this.asyncHandler(async (req, res) => {
    // Validate
    const validatedData = updateUserSchema.parse(req.body);
    
    // Custom validation
    if (Object.keys(validatedData).length === 0) {
        return this.sendError(res, 'At least one field is required', 400);
    }
    
    // Process
    const updated = await this.userService.updateUser(id, validatedData);
});
```

### Pattern 3: Parameter Validation

```typescript
getById = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Simple parameter validation
    if (!id || isNaN(Number(id))) {
        return this.sendError(res, 'Invalid ID', 400);
    }
    
    const user = await this.userService.getUserById(Number(id));
});
```

## Available Zod Validators

```typescript
// Strings
z.string()
  .min(1, 'Required')
  .max(100, 'Too long')
  .email('Invalid email')
  .url('Invalid URL')
  .regex(/pattern/, 'Invalid format')

// Numbers
z.number()
  .int('Must be integer')
  .positive('Must be positive')
  .min(0)
  .max(100)

// Booleans
z.boolean()

// Optional fields
z.string().optional()

// Enums
z.enum(['admin', 'user', 'guest'])

// Objects
z.object({
    name: z.string(),
    age: z.number()
})

// Arrays
z.array(z.string())

// Custom validation
z.string().refine(val => val.length > 0, {
    message: 'Custom validation failed'
})
```

## Testing Error Handling

### Test Validation Errors

```bash
# Missing required fields
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'

# Invalid email
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "invalid"}'
```

### Test 404 Errors

```bash
# Invalid route
curl http://localhost:3000/api/invalid-route

# Resource not found
curl http://localhost:3000/api/users/99999
```

### Test Parameter Validation

```bash
# Invalid ID format
curl http://localhost:3000/api/users/abc
```

## Best Practices

### ✅ DO:

- Define validation schemas at the top of controller files
- Use `asyncHandler` wrapper for all async methods
- Throw `ApiErrorClass` for custom errors
- Use descriptive error messages
- Validate all user input
- Check parameter types (IDs, etc.)

### ❌ DON'T:

- Don't catch errors in controllers (let global handler do it)
- Don't use try-catch unless you need custom error handling
- Don't put validation in services (keep it in controllers)
- Don't expose sensitive error details in production

## Logging

All errors are automatically logged with details:

```typescript
logger.error('Global error handler caught error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
});
```

## Custom ApiErrorClass

Create custom errors with status codes:

```typescript
import { ApiErrorClass } from '../lib/app/error';

// In service or controller
throw new ApiErrorClass('User already exists', 409);
throw new ApiErrorClass('Unauthorized access', 401);
throw new ApiErrorClass('Payment required', 402);
```

## Summary

- ✅ **Zod validation** inline in controllers
- ✅ **Global error handler** catches all errors
- ✅ **Consistent error format** for all responses
- ✅ **No separate validation layer** - keeps it simple
- ✅ **Type-safe** validation with TypeScript
- ✅ **Automatic logging** of all errors

This approach minimizes complexity while maintaining robust error handling and validation! 🎉
