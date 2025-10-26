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
import { createStorageInstance } from '../storage';

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

  // Register multiple storage instances for different use cases
  // Each storage can have different configuration (local, S3, different buckets, etc.)

  // Default storage - uses config from storage.ts
  const defaultStorage = await createStorageInstance();
  container.registerInstance(TOKENS.Storage, defaultStorage);

  // Storage for user uploads (avatars, profiles, etc.)
  // You can customize the config per storage type
  const userStorage = await createStorageInstance(
    config.storage.type === 's3'
      ? {
          kind: 's3',
          ...config.storage.s3,
          bucket: process.env.S3_USER_BUCKET || config.storage.s3.bucket,
        }
      : {
          kind: 'local',
          ...config.storage.local,
          rootDir: process.env.STORAGE_USER_DIR || `${config.storage.local.rootDir}/users`,
        }
  );
  container.registerInstance(TOKENS.StorageUser, userStorage);

  // Storage for post attachments
  const postStorage = await createStorageInstance(
    config.storage.type === 's3'
      ? {
          kind: 's3',
          ...config.storage.s3,
          bucket: process.env.S3_POST_BUCKET || config.storage.s3.bucket,
        }
      : {
          kind: 'local',
          ...config.storage.local,
          rootDir: process.env.STORAGE_POST_DIR || `${config.storage.local.rootDir}/posts`,
        }
  );
  container.registerInstance(TOKENS.StoragePost, postStorage);

  // Storage for documents/files
  const documentStorage = await createStorageInstance(
    config.storage.type === 's3'
      ? {
          kind: 's3',
          ...config.storage.s3,
          bucket: process.env.S3_DOCUMENT_BUCKET || config.storage.s3.bucket,
        }
      : {
          kind: 'local',
          ...config.storage.local,
          rootDir: process.env.STORAGE_DOCUMENT_DIR || `${config.storage.local.rootDir}/documents`,
        }
  );
  container.registerInstance(TOKENS.StorageDocument, documentStorage);
}

export { container, TOKENS };
