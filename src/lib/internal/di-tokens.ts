/**
 * Dependency Injection Tokens
 *
 * These are Symbol-based tokens used for type-safe dependency injection
 */
export const TOKENS = {
  SequelizeUser: Symbol.for('SequelizeUser'),
  SequelizePost: Symbol.for('SequelizePost'),
  UserRepository: Symbol.for('UserRepository'),
  PostRepository: Symbol.for('PostRepository'),
  UserService: Symbol.for('UserService'),
  PostService: Symbol.for('PostService'),
  UserController: Symbol.for('UserController'),
  PostController: Symbol.for('PostController'),
  Logger: Symbol.for('Logger'),

  // Storage tokens - support multiple storage instances
  Storage: Symbol.for('Storage'), // Default storage
  StorageUser: Symbol.for('StorageUser'), // For user-related uploads
  StoragePost: Symbol.for('StoragePost'), // For post attachments
  StorageDocument: Symbol.for('StorageDocument'), // For documents/files
} as const;
