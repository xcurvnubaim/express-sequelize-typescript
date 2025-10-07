/**
 * Dependency Injection Tokens
 * 
 * These are Symbol-based tokens used for type-safe dependency injection
 */
export const TOKENS = {
    Sequelize: Symbol.for("Sequelize"),
    UserRepository: Symbol.for("UserRepository"),
    PostRepository: Symbol.for("PostRepository"),
    UserService: Symbol.for("UserService"),
    PostService: Symbol.for("PostService"),
    UserController: Symbol.for("UserController"),
    PostController: Symbol.for("PostController"),
} as const;
