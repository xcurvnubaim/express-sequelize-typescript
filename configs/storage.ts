export type StorageType = 'local' | 's3';

export interface LocalStorageConfig {
  rootDir: string;
  baseUrl: string;
  defaultExpirySec: number;
}

export interface S3StorageConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  autoCreateBucket: boolean;
  defaultExpirySec: number;
}

export interface StorageConfig {
  type: StorageType;
  local: LocalStorageConfig;
  s3: S3StorageConfig;
}

export const storage: StorageConfig = {
  type: (process.env.STORAGE_TYPE as StorageType) || 'local',
  local: {
    rootDir: process.env.STORAGE_ROOT_DIR || './uploads',
    baseUrl:
      process.env.STORAGE_BASE_URL || `http://localhost:${process.env.APP_PORT || 8000}/uploads`,
    defaultExpirySec: Number(process.env.STORAGE_DEFAULT_EXPIRY_SEC || 3600),
  },
  s3: {
    bucket: process.env.S3_BUCKET || '',
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
    autoCreateBucket: String(process.env.S3_AUTO_CREATE_BUCKET || 'true') === 'true',
    defaultExpirySec: Number(process.env.S3_DEFAULT_EXPIRY_SEC || 3600),
  },
};