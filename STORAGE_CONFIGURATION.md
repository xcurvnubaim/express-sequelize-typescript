# Storage Configuration Guide

This application supports multiple storage systems with dependency injection, allowing you to use different storage backends for different use cases.

## Storage Types

The system supports **4 storage instances** that can be configured independently:

1. **Default Storage** (`TOKENS.Storage`) - General purpose storage
2. **User Storage** (`TOKENS.StorageUser`) - User avatars, profiles, etc.
3. **Post Storage** (`TOKENS.StoragePost`) - Post attachments and media
4. **Document Storage** (`TOKENS.StorageDocument`) - Documents and files

## Storage Backends

Each storage instance can use either:

- **Local File System** - Files stored on the server
- **S3/MinIO** - Object storage (AWS S3 or MinIO compatible)

## Configuration

### Environment Variables

#### Main Storage Type

```bash
STORAGE_TYPE=local  # or 's3'
```

#### Local Storage (when STORAGE_TYPE=local)

```bash
STORAGE_ROOT_DIR=./uploads
STORAGE_BASE_URL=http://localhost:3000/uploads
STORAGE_DEFAULT_EXPIRY_SEC=3600

# Optional: Custom directories for each storage type
STORAGE_USER_DIR=./uploads/users
STORAGE_POST_DIR=./uploads/posts
STORAGE_DOCUMENT_DIR=./uploads/documents
```

#### S3 Storage (when STORAGE_TYPE=s3)

```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=default-bucket
S3_FORCE_PATH_STYLE=true
S3_AUTO_CREATE_BUCKET=true
S3_DEFAULT_EXPIRY_SEC=3600

# Optional: Custom buckets for each storage type
S3_USER_BUCKET=user-uploads
S3_POST_BUCKET=post-attachments
S3_DOCUMENT_BUCKET=documents
```

## Directory/Bucket Structure

### Local Storage (default)

```
./uploads/
  ├── users/           # User-related files
  ├── posts/           # Post attachments
  └── documents/       # General documents
```

### S3 Storage

Each storage type can have its own bucket, or all can share one bucket with different prefixes.

## Usage in Services

### Injecting Storage

Services can inject the specific storage they need:

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../lib/internal/di-tokens';
import type { Storage } from '../../lib/storage';

@injectable()
export class PostService {
  constructor(
    @inject(TOKENS.PostRepository) private postRepository: PostRepository,
    @inject(TOKENS.StoragePost) private storage: Storage // Post-specific storage
  ) {}

  async handleUpload(file: Express.Multer.File) {
    const key = `posts/${Date.now()}-${file.originalname}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    const url = await this.storage.getSignedUrl(key);
    return { key, url };
  }
}
```

### Available Storage Tokens

```typescript
import { TOKENS } from './lib/internal/di-tokens';

// Use in @inject() decorator:
TOKENS.Storage; // Default storage
TOKENS.StorageUser; // User uploads
TOKENS.StoragePost; // Post attachments
TOKENS.StorageDocument; // Documents
```

## Storage Interface

All storage instances implement the same interface:

```typescript
interface Storage {
  ensureReady(): Promise<void>;
  put(key: string, body: Buffer | string, contentType?: string): Promise<void>;
  getText(key: string): Promise<string>;
  getStream(key: string): Promise<Readable>;
  getSignedUrl(key: string, expiresInSec?: number): Promise<string>;
  list(prefix?: string): Promise<ListObject[]>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}
```

## Examples

### Example 1: Local Storage for Development

```bash
# .env
STORAGE_TYPE=local
STORAGE_ROOT_DIR=./uploads
STORAGE_USER_DIR=./uploads/users
STORAGE_POST_DIR=./uploads/posts
```

Result: All files stored locally in separate directories.

### Example 2: S3 Storage with Single Bucket

```bash
# .env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=my-app-uploads
```

Result: All storage instances use the same S3 bucket, files organized by service.

### Example 3: Mixed - S3 with Multiple Buckets

```bash
# .env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=default-bucket

# Separate buckets for different use cases
S3_USER_BUCKET=user-profiles
S3_POST_BUCKET=post-media
S3_DOCUMENT_BUCKET=app-documents
```

Result: Each storage type uses its own dedicated S3 bucket.

### Example 4: MinIO for Development

```bash
# .env
STORAGE_TYPE=s3
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=dev-uploads
S3_FORCE_PATH_STYLE=true
S3_AUTO_CREATE_BUCKET=true
```

Result: All files stored in local MinIO instance, great for development.

## Migration Notes

If you're upgrading from the old singleton `storageService`, note these changes:

**Old way:**

```typescript
import { storageService } from '../lib/storage';

const storage = storageService.getStorage();
await storage.put(key, buffer);
```

**New way (with DI):**

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/internal/di-tokens';
import type { Storage } from '../lib/storage';

@injectable()
class MyService {
  constructor(@inject(TOKENS.Storage) private storage: Storage) {}

  async upload(key: string, buffer: Buffer) {
    await this.storage.put(key, buffer);
  }
}
```

## Benefits of Multiple Storage Systems

1. **Separation of Concerns**: User files separate from post media
2. **Different Backends**: Use S3 for posts, local for temp files
3. **Cost Optimization**: Different retention policies per storage type
4. **Security**: Fine-grained access control per bucket/directory
5. **Scalability**: Easy to move specific storage types to different providers

## Testing

Each storage instance is independently testable:

```typescript
import { container } from 'tsyringe';
import { TOKENS } from './lib/internal/di-tokens';

// Get storage instances
const defaultStorage = container.resolve<Storage>(TOKENS.Storage);
const postStorage = container.resolve<Storage>(TOKENS.StoragePost);

// Test
await postStorage.put('test.txt', Buffer.from('hello'));
const url = await postStorage.getSignedUrl('test.txt');
```
