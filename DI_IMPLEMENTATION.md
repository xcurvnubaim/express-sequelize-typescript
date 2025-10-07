# Dependency Injection Implementation

This project now uses **tsyringe** for dependency injection, providing better testability, maintainability, and loose coupling between components.

## What's Been Added

### 1. Dependencies
- `tsyringe` - Lightweight dependency injection container for TypeScript

### 2. DI Container Setup
- **Location**: `src/lib/app/di-container.ts`
- **Purpose**: Centralized container configuration and token definitions
- **Usage**: Initialized at application startup

### 3. Tokens
All dependencies are registered with Symbol tokens for type-safe injection:

```typescript
export const TOKENS = {
    Sequelize: Symbol.for("Sequelize"),
    UserRepository: Symbol.for("UserRepository"),
    PostRepository: Symbol.for("PostRepository"),
    UserService: Symbol.for("UserService"),
    PostService: Symbol.for("PostService"),
    UserController: Symbol.for("UserController"),
    PostController: Symbol.for("PostController"),
}
```

## Architecture

### Repositories
- Base class for common database operations
- Concrete repositories decorated with `@injectable()`
- Inject Sequelize instance via `@inject(TOKENS.Sequelize)`

**Example**:
```typescript
@injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(@inject(TOKENS.Sequelize) sequelize: Sequelize) {
        super(User, sequelize);
    }
}
```

### Services
- Business logic layer
- Decorated with `@injectable()`
- Inject repositories via tokens

**Example**:
```typescript
@injectable()
export class UserService extends BaseService {
    constructor(
        @inject(TOKENS.UserRepository) private userRepository: UserRepository
    ) {
        super();
    }
}
```

### Controllers
- Handle HTTP requests/responses
- Decorated with `@injectable()`
- Inject services via tokens
- Use arrow functions to maintain `this` context

**Example**:
```typescript
@injectable()
export class UserController extends BaseController {
    constructor(
        @inject(TOKENS.UserService) private userService: UserService
    ) {
        super();
    }

    getUsers = this.asyncHandler(async (req: Request, res: Response) => {
        const users = await this.userService.getAllUsers();
        this.sendSuccess(res, users);
    });
}
```

### Routes
- Factory functions that resolve controllers from the container
- No direct instantiation needed

**Example**:
```typescript
export function createUserRoutes(): Router {
    const router = Router();
    const userController = container.resolve<UserController>(TOKENS.UserController);

    router.get('/', userController.getUsers);
    router.post('/', userController.createUser);
    
    return router;
}
```

## How to Use

### Adding New Components

#### 1. Create a Repository
```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';

@injectable()
export class MyRepository extends BaseRepository<MyModel> {
    constructor(@inject(TOKENS.Sequelize) sequelize: Sequelize) {
        super(MyModel, sequelize);
    }
}
```

#### 2. Create a Service
```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';

@injectable()
export class MyService extends BaseService {
    constructor(
        @inject(TOKENS.MyRepository) private myRepository: MyRepository
    ) {
        super();
    }
}
```

#### 3. Create a Controller
```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';

@injectable()
export class MyController extends BaseController {
    constructor(
        @inject(TOKENS.MyService) private myService: MyService
    ) {
        super();
    }

    // Use arrow functions for route handlers
    getItems = this.asyncHandler(async (req, res) => {
        const items = await this.myService.getAll();
        this.sendSuccess(res, items);
    });
}
```

#### 4. Register in DI Container
Update `src/lib/app/di-container.ts`:

```typescript
// Add token
export const TOKENS = {
    // ...existing tokens
    MyRepository: Symbol.for("MyRepository"),
    MyService: Symbol.for("MyService"),
    MyController: Symbol.for("MyController"),
}

// Register in initializeContainer()
export function initializeContainer(): void {
    // ...existing registrations
    container.register(TOKENS.MyRepository, { useClass: MyRepository });
    container.register(TOKENS.MyService, { useClass: MyService });
    container.register(TOKENS.MyController, { useClass: MyController });
}
```

#### 5. Create Routes
```typescript
import { container } from '../lib/app/di-container';

export function createMyRoutes(): Router {
    const router = Router();
    const myController = container.resolve<MyController>(TOKENS.MyController);

    router.get('/', myController.getItems);
    
    return router;
}
```

## Benefits

1. **Testability**: Easy to mock dependencies in unit tests
2. **Maintainability**: Clear dependencies and single responsibility
3. **Loose Coupling**: Components depend on abstractions, not concrete implementations
4. **Type Safety**: TypeScript decorators ensure type-safe injection
5. **Scalability**: Easy to add new features without modifying existing code

## Running the Application

```bash
# Install dependencies
bun install

# Run the application
bun run src/index.ts
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/with-user` - Get posts with user details
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/user/:userId` - Get posts by user ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Health Check
- `GET /health` - Application health status

## Testing with DI

```typescript
import { container } from 'tsyringe';

// In tests, you can override registrations
const mockRepository = {
    findAll: jest.fn().mockResolvedValue([/* mock data */])
};

container.register(TOKENS.UserRepository, { useValue: mockRepository });

// Then resolve and test
const service = container.resolve<UserService>(TOKENS.UserService);
```

## Notes

- `reflect-metadata` must be imported first in the entry point
- Decorators (`@injectable`, `@inject`) require `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig.json`
- The DI container is initialized once at application startup
- Controllers use arrow functions to preserve `this` context in route handlers
