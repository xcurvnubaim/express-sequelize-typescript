// storage-factory.ts
import { LocalStorage, type LocalStorageOptions } from './local';
import { S3Storage, type S3StorageOptions } from './s3';

import type { Storage } from '.';

export type StorageKind = 's3' | 'local';

export type StorageFactoryOptions =
  | ({ kind: 's3' } & S3StorageOptions)
  | ({ kind: 'local' } & LocalStorageOptions);

export function createStorage(opts: StorageFactoryOptions): Storage {
  if (opts.kind === 's3') return new S3Storage(opts);
  return new LocalStorage(opts);
}
