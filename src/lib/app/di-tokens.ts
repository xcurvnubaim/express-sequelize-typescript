import { Sequelize } from "sequelize";

/**
 * Dependency Injection Tokens
 * 
 * These are Symbol-based tokens used for type-safe dependency injection
 */
export const TOKENS = {
    SequelizeUser: Symbol.for("SequelizeUser"),
    SequelizePost: Symbol.for("SequelizePost"),
    UserRepository: Symbol.for("UserRepository"),
    PostRepository: Symbol.for("PostRepository"),
    UserService: Symbol.for("UserService"),
    PostService: Symbol.for("PostService"),
    UserController: Symbol.for("UserController"),
    PostController: Symbol.for("PostController"),
    Logger: Symbol.for("Logger"),
} as const;
