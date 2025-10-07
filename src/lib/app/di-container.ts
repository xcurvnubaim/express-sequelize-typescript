import "reflect-metadata";
import { container } from "tsyringe";
import { config } from "../../../configs";
import { newDB } from "./db";
import { TOKENS } from "./di-tokens";
import { UserRepository } from "../../repositories/user.repository";
import { PostRepository } from "../../repositories/post.repository";
import { UserService } from "../../services/user.service";
import { PostService } from "../../services/post.service";
import { UserController } from "../../controllers/user.controller";
import { PostController } from "../../controllers/post.controller";
import { createLogger } from "./logger";

/**
 * Initialize the dependency injection container
 * This should be called once at application startup
 */
export function initializeContainer(): void {
    // Register Logger first (other services might need it)
    const logger = createLogger(config.logging);
    container.registerInstance(TOKENS.Logger, logger);

    // Register Sequelize instance as singleton
    const dbUser = newDB(config.databases["user"]);
    // const dbPost = newDB(config.databases["post"]);

    container.registerInstance(TOKENS.SequelizeUser, dbUser);
    // container.registerInstance(TOKENS.SequelizePost, dbPost);
    
    // Register repositories
    container.register(TOKENS.UserRepository, { useClass: UserRepository });
    container.register(TOKENS.PostRepository, { useClass: PostRepository });
    
    // Register services
    container.register(TOKENS.UserService, { useClass: UserService });
    container.register(TOKENS.PostService, { useClass: PostService });
    
    // Register controllers
    container.register(TOKENS.UserController, { useClass: UserController });
    container.register(TOKENS.PostController, { useClass: PostController });
}

export { container, TOKENS };
