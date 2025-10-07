import "reflect-metadata";
import { container } from "tsyringe";
import { Sequelize } from "sequelize-typescript";
import { config } from "../../../configs";
import { newDB } from "./db";
import { TOKENS } from "./di-tokens";
import { UserRepository } from "../../repositories/user.repository";
import { PostRepository } from "../../repositories/post.repository";
import { UserService } from "../../services/user.service";
import { PostService } from "../../services/post.service";
import { UserController } from "../../controllers/user.controller";
import { PostController } from "../../controllers/post.controller";
import { User } from "../../models/user.model";

/**
 * Initialize the dependency injection container
 * This should be called once at application startup
 */
export function initializeContainer(): void {
    // Register Sequelize instance as singleton
    const db = newDB(config.databases["user"]);
    container.registerInstance(TOKENS.Sequelize, db);
    
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
