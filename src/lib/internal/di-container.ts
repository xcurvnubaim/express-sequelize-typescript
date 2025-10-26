import 'reflect-metadata';
import { container } from 'tsyringe';
import { config } from '../../../configs';
import { newDB } from './db';
import { TOKENS } from './di-tokens';
import { UserRepository } from '../../app/repositories/user.repository';
import { PostRepository } from '../../app/repositories/post.repository';
import { UserService } from '../../app/services/user.service';
import { PostService } from '../../app/services/post.service';
import { UserController } from '../../app/controllers/user.controller';
import { PostController } from '../../app/controllers/post.controller';
import createLogger from './logger';
import { storageService } from '../storage';

/**
 * Initialize the dependency injection container
 * This should be called once at application startup
 */
export async function initializeContainer(): Promise<void> {
  // Register Logger first (other services might need it)
  const logger = createLogger(config.logging);
  container.registerInstance(TOKENS.Logger, logger);

  // Register Sequelize instance as singleton
  const dbUser = newDB(config.databases['user']);
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

  // Initialize storage service early so services can use it for file handling
  await storageService.initialize({
    kind: 'local',
    ...config.storage.local,
  });
  container.register(TOKENS.Storage, { useValue: storageService.getStorage() });
}

export { container, TOKENS };
