# Dependency Injection Architecture

## Visual Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP REQUEST                              │
│                     GET /api/users                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  createUserRoutes()                                       │  │
│  │  - Resolves UserController from DI Container             │  │
│  │  - Maps HTTP methods to controller methods               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @injectable()                                            │  │
│  │  UserController                                           │  │
│  │  - Handles HTTP requests/responses                        │  │
│  │  - Validates input                                        │  │
│  │  - Calls service layer                                    │  │
│  │  - Formats responses                                      │  │
│  │                                                            │  │
│  │  constructor(@inject(TOKENS.UserService) userService)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @injectable()                                            │  │
│  │  UserService                                              │  │
│  │  - Business logic                                         │  │
│  │  - Data transformation                                    │  │
│  │  - Calls repository layer                                 │  │
│  │                                                            │  │
│  │  constructor(@inject(TOKENS.UserRepository) userRepo)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @injectable()                                            │  │
│  │  UserRepository extends BaseRepository                    │  │
│  │  - Database queries                                       │  │
│  │  - CRUD operations                                        │  │
│  │  - Data access logic                                      │  │
│  │                                                            │  │
│  │  constructor(@inject(TOKENS.Sequelize) sequelize)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│                    (Sequelize + MySQL)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Injection Container

```
┌─────────────────────────────────────────────────────────────────┐
│                    DI CONTAINER (tsyringe)                       │
│                                                                   │
│  TOKENS (Symbols for type-safe injection)                        │
│  ├── Sequelize          → Sequelize Instance (Singleton)         │
│  ├── UserRepository     → UserRepository Class                   │
│  ├── PostRepository     → PostRepository Class                   │
│  ├── UserService        → UserService Class                      │
│  ├── PostService        → PostService Class                      │
│  ├── UserController     → UserController Class                   │
│  └── PostController     → PostController Class                   │
│                                                                   │
│  Resolution Flow:                                                │
│  1. Request for UserController                                   │
│  2. Container sees it needs UserService                          │
│  3. Container sees UserService needs UserRepository              │
│  4. Container sees UserRepository needs Sequelize                │
│  5. Container resolves Sequelize (singleton)                     │
│  6. Container creates UserRepository with Sequelize              │
│  7. Container creates UserService with UserRepository            │
│  8. Container creates UserController with UserService            │
│  9. Returns fully constructed UserController                     │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure with DI

```
src/
├── index.ts                    # App entry point
│   └── initializeContainer()   # Initialize DI container
│
├── lib/app/
│   ├── di-container.ts         # DI configuration & tokens
│   ├── db.ts                   # Sequelize setup
│   └── ...
│
├── models/                     # Sequelize models
│   ├── user.model.ts
│   └── post.model.ts
│
├── repositories/               # Data access layer
│   ├── base.repository.ts      # Base repository class
│   ├── user.repository.ts      # @injectable() + @inject()
│   └── post.repository.ts      # @injectable() + @inject()
│
├── services/                   # Business logic layer
│   ├── base.service.ts         # Base service class
│   ├── user.service.ts         # @injectable() + @inject()
│   └── post.service.ts         # @injectable() + @inject()
│
├── controllers/                # HTTP handlers
│   ├── base.controller.ts      # Base controller with utilities
│   ├── user.controller.ts      # @injectable() + @inject()
│   └── post.controller.ts      # @injectable() + @inject()
│
└── routes/                     # Express routes
    ├── users.route.ts          # Resolves UserController from container
    └── posts.route.ts          # Resolves PostController from container
```

## Key Decorators

### @injectable()
Marks a class as available for dependency injection
```typescript
@injectable()
export class UserService { ... }
```

### @inject(token)
Injects a dependency using a token
```typescript
constructor(@inject(TOKENS.UserRepository) private repo: UserRepository)
```

## Benefits Visualization

```
Traditional Approach (Tightly Coupled):
┌──────────────┐
│ Controller   │
│              │
│ const service│ ← Directly instantiates
│  = new       │ ← Hard to test
│  UserService │ ← Hard to mock
│  (new Repo)  │ ← Hard to change
└──────────────┘

DI Approach (Loosely Coupled):
┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│ Controller   │ ←──→ │ DI Container│ ←──→ │ Service      │
│              │      │             │      │              │
│ Depends on:  │      │ Manages:    │      │ Depends on:  │
│ IService     │      │ All deps    │      │ IRepository  │
└──────────────┘      └─────────────┘      └──────────────┘
     ↑                                           ↑
     └─── Easy to test (mock IService) ─────────┘
     └─── Easy to change implementations ───────┘
```

## Testing Benefits

```
Without DI:
❌ Hard to test
❌ Need real database
❌ Coupled to implementation

const controller = new UserController(
    new UserService(
        new UserRepository(realDatabase)  // ← Need real DB!
    )
);

With DI:
✅ Easy to test
✅ Mock dependencies
✅ Isolated unit tests

const mockRepo = { findAll: jest.fn() };
container.register(TOKENS.UserRepository, { useValue: mockRepo });
const service = container.resolve<UserService>(TOKENS.UserService);
// Service uses mock instead of real repository!
```

## Request Lifecycle Example

```
1. HTTP Request
   GET /api/users
         ↓

2. Express Router
   routes/users.route.ts
   const controller = container.resolve(TOKENS.UserController)
         ↓

3. DI Container
   - Creates UserController
   - Injects UserService
   - Injects UserRepository (into service)
   - Injects Sequelize (into repository)
         ↓

4. UserController.getUsers()
   calls → this.userService.getAllUsers()
         ↓

5. UserService.getAllUsers()
   calls → this.userRepository.findAll()
         ↓

6. UserRepository.findAll()
   queries → this.sequelize (database)
         ↓

7. Response flows back
   Database → Repository → Service → Controller → HTTP Response
```

## Summary

- **tsyringe** manages all dependencies automatically
- **Tokens** provide type-safe dependency identification
- **Decorators** (`@injectable`, `@inject`) enable DI
- **Container** resolves dependency graph automatically
- **Testing** becomes trivial with mockable dependencies
- **SOLID principles** are followed naturally
