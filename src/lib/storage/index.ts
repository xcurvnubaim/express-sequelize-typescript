import { Readable } from 'node:stream';

import { createStorage, type StorageFactoryOptions } from './storage-factory';
import { storage as storageConfig } from '../../../configs/storage';

/** Shared types */
export type BinaryLike = Buffer | Uint8Array | string | Readable;

export interface ListObject {
  key: string;
  size?: number;
  lastModified?: Date;
}

export interface Storage {
  ensureReady(): Promise<void>;
  put(key: string, body: BinaryLike, contentType?: string): Promise<void>;
  getText(key: string): Promise<string>;
  getStream(key: string): Promise<Readable>;
  getSignedUrl(key: string, expiresInSec?: number): Promise<string>;
  list(prefix?: string): Promise<ListObject[]>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}

class StorageService {
  private static instance: StorageService;
  private storage: Storage | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async initialize(options?: StorageFactoryOptions): Promise<StorageService> {
    if (this.isInitialized) {
      return this; // Already initialized
    }

    const storageOptions: StorageFactoryOptions = options || this.getDefaultOptions();

    this.storage = createStorage(storageOptions);
    await this.storage.ensureReady();
    this.isInitialized = true;

    return this;
  }

  public getStorage(): Storage {
    if (!this.storage || !this.isInitialized) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  private getDefaultOptions(): StorageFactoryOptions {
    const cfg = storageConfig;

    if (cfg.type === 's3') {
      return {
        kind: 's3',
        bucket: cfg.s3.bucket,
        endpoint: cfg.s3.endpoint,
        region: cfg.s3.region,
        accessKeyId: cfg.s3.accessKeyId,
        secretAccessKey: cfg.s3.secretAccessKey,
        forcePathStyle: cfg.s3.forcePathStyle,
        autoCreateBucket: cfg.s3.autoCreateBucket,
        defaultExpirySec: cfg.s3.defaultExpirySec,
      };
    }

    // Default to local storage
    return {
      kind: 'local',
      rootDir: cfg.local.rootDir,
      baseUrl: cfg.local.baseUrl,
      defaultExpirySec: cfg.local.defaultExpirySec,
    };
  }

  public async cleanup(): Promise<void> {
    // Add any cleanup logic if needed
    this.isInitialized = false;
    this.storage = null;
  }
}

export const storageService = StorageService.getInstance();

/**
 * Factory function to create named storage instances for dependency injection
 * This allows multiple storage configurations (e.g., user uploads, posts, documents)
 */
export async function createStorageInstance(options?: StorageFactoryOptions): Promise<Storage> {
  const storageOptions: StorageFactoryOptions =
    options ||
    ({
      kind: storageConfig.type === 's3' ? 's3' : 'local',
      ...(storageConfig.type === 's3' ? storageConfig.s3 : storageConfig.local),
    } as StorageFactoryOptions);

  const instance = createStorage(storageOptions);
  await instance.ensureReady();
  return instance;
}
