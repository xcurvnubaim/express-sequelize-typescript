// s3-storage.ts
import { Readable } from 'node:stream';

import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { Storage, BinaryLike, ListObject } from '.';
import type { ListObjectsV2CommandOutput, _Object as S3Object } from '@aws-sdk/client-s3';

export type S3StorageOptions = {
  bucket: string;
  endpoint: string; // e.g. http://localhost:9000 or https://minio.example.com
  region?: string; // MinIO accepts any; default "us-east-1"
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean; // default true for MinIO
  multipart?: { partSize?: number; queueSize?: number };
  // If you already ensure bucket elsewhere, you can skip ensureReady()
  autoCreateBucket?: boolean; // default true
  // Optional: override presign expiry
  defaultExpirySec?: number; // default 600
};

export class S3Storage implements Storage {
  private s3: S3Client;
  private bucket: string;
  private defaultExpiry: number;
  private multipartCfg: Required<Required<S3StorageOptions>['multipart']>;

  constructor(private opts: S3StorageOptions) {
    this.bucket = opts.bucket;
    this.defaultExpiry = opts.defaultExpirySec ?? 600;
    this.multipartCfg = {
      partSize: opts.multipart?.partSize ?? 8 * 1024 * 1024,
      queueSize: opts.multipart?.queueSize ?? 4,
    };

    this.s3 = new S3Client({
      region: opts.region ?? 'us-east-1',
      endpoint: opts.endpoint,
      forcePathStyle: opts.forcePathStyle ?? true,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async ensureReady(): Promise<void> {
    if (this.opts.autoCreateBucket === false) return;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async put(key: string, body: BinaryLike, contentType?: string): Promise<void> {
    // Use multipart for streams or large payloads
    const asReadable =
      typeof body !== 'string' && !(body instanceof Buffer) && !(body instanceof Uint8Array);

    if (asReadable || (Buffer.isBuffer(body) && body.byteLength > this.multipartCfg.partSize)) {
      const uploader = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: body as Buffer | Uint8Array | Readable | string,
          ContentType: contentType,
        },
        partSize: this.multipartCfg.partSize,
        queueSize: this.multipartCfg.queueSize,
        leavePartsOnError: false,
      });
      await uploader.done();
      return;
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body as Buffer | Uint8Array | string,
        ContentType: contentType,
      })
    );
  }

  async getText(key: string): Promise<string> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const text = await res.Body?.transformToString();
    return text ?? '';
  }

  async getStream(key: string): Promise<Readable> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const body = res.Body;
    if (!body) throw new Error('No object body');
    // In Node18+, body is already a Readable
    if (body instanceof Readable) return body;
    // Fallback for edge cases
    // @ts-expect-error Readable.fromWeb may not exist
    return Readable.fromWeb?.(body as unknown) ?? (body as Readable);
  }

  async getSignedUrl(key: string, expiresInSec?: number): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSec ?? this.defaultExpiry,
    });
  }

  async list(prefix?: string): Promise<ListObject[]> {
    const out: ListObject[] = [];
    let token: string | undefined = undefined;
    do {
      const res: ListObjectsV2CommandOutput = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        })
      );
      out.push(
        ...(res.Contents ?? []).map((o: S3Object) => ({
          key: o.Key || '',
          size: o.Size,
          lastModified: o.LastModified ? new Date(o.LastModified) : undefined,
        }))
      );
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  }
}
