/**
 * Example: How Dependency Injection Works in This Codebase
 * 
 * This file demonstrates the complete flow from request to database
 * using dependency injection.
 */

// ============================================================================
// 1. DEFINE DEPENDENCIES
// ============================================================================

// In src/lib/app/di-container.ts
import { container } from "tsyringe";

export const TOKENS = {
    Sequelize: Symbol.for("Sequelize"),
    UserRepository: Symbol.for("UserRepository"),
    UserService: Symbol.for("UserService"),
    UserController: Symbol.for("UserController"),
};

// ============================================================================
// 2. REPOSITORY LAYER - Data Access
// ============================================================================

import { injectable, inject } from "tsyringe";
import { Sequelize } from "sequelize-typescript";

// Repository is marked as injectable
@injectable()
class UserRepository {
    // Sequelize is injected using the token
    constructor(@inject(TOKENS.Sequelize) private sequelize: Sequelize) {}
    
    async findAll() {
        // Database logic here
        return [];
    }
}

// ============================================================================
// 3. SERVICE LAYER - Business Logic
// ============================================================================

// Service is marked as injectable
@injectable()
class UserService {
    // UserRepository is injected automatically by the DI container
    constructor(@inject(TOKENS.UserRepository) private userRepo: UserRepository) {}
    
    async getAllUsers() {
        // Business logic here
        const users = await this.userRepo.findAll();
        // Additional processing...
        return users;
    }
}

// ============================================================================
// 4. CONTROLLER LAYER - HTTP Handlers
// ============================================================================

import type { Request, Response } from "express";

// Controller is marked as injectable
@injectable()
class UserController {
    // UserService is injected automatically
    constructor(@inject(TOKENS.UserService) private userService: UserService) {}
    
    // Arrow function maintains 'this' context
    getUsers = async (req: Request, res: Response) => {
        const users = await this.userService.getAllUsers();
        res.json({ success: true, data: users });
    };
}

// ============================================================================
// 5. ROUTES - Express Router Setup
// ============================================================================

import { Router } from "express";

function createUserRoutes(): Router {
    const router = Router();
    
    // Resolve controller from DI container - NO manual instantiation!
    const userController = container.resolve<UserController>(TOKENS.UserController);
    
    // Register route handlers
    router.get("/users", userController.getUsers);
    
    return router;
}

// ============================================================================
// 6. APPLICATION STARTUP
// ============================================================================

function initializeContainer() {
    // Register Sequelize instance
    const db = new Sequelize(/* config */);
    container.registerInstance(TOKENS.Sequelize, db);
    
    // Register all classes
    container.register(TOKENS.UserRepository, { useClass: UserRepository });
    container.register(TOKENS.UserService, { useClass: UserService });
    container.register(TOKENS.UserController, { useClass: UserController });
}

// Start app
import express from "express";
const app = express();

// Initialize DI container FIRST
initializeContainer();

// Register routes
app.use("/api", createUserRoutes());

// Start server
app.listen(3000);

// ============================================================================
// 7. REQUEST FLOW
// ============================================================================

/**
 * When a request comes in:
 * 
 * 1. Request: GET /api/users
 * 
 * 2. Express Router matches route → calls userController.getUsers
 * 
 * 3. UserController.getUsers executes:
 *    - Already has UserService injected in constructor
 *    - Calls this.userService.getAllUsers()
 * 
 * 4. UserService.getAllUsers executes:
 *    - Already has UserRepository injected in constructor
 *    - Calls this.userRepo.findAll()
 * 
 * 5. UserRepository.findAll executes:
 *    - Already has Sequelize injected in constructor
 *    - Queries database
 *    - Returns results
 * 
 * 6. Results flow back up:
 *    Repository → Service → Controller → Response to client
 */

// ============================================================================
// 8. BENEFITS
// ============================================================================

/**
 * ✅ No manual instantiation - DI container handles it
 * ✅ Easy to test - just mock the dependencies
 * ✅ Loose coupling - components don't know about each other's implementation
 * ✅ Type safe - TypeScript ensures correct types
 * ✅ Single Responsibility - each layer has one job
 * ✅ Easy to extend - add new features without changing existing code
 */

// ============================================================================
// 9. TESTING EXAMPLE
// ============================================================================

/**
 * In your tests:
 */

// Mock the repository
const mockRepository = {
    findAll: jest.fn().mockResolvedValue([{ id: 1, name: "Test" }])
};

// Register the mock
container.register(TOKENS.UserRepository, { useValue: mockRepository });

// Resolve service - it will get the mock repository!
const service = container.resolve<UserService>(TOKENS.UserService);

// Test the service
const users = await service.getAllUsers();
expect(users).toHaveLength(1);
expect(mockRepository.findAll).toHaveBeenCalled();

/**
 * This is the power of dependency injection! 🚀
 */
