import multer, { StorageEngine } from 'multer';

import { storageService } from '@lib/storage';

import type { Request } from 'express';

// A Multer StorageEngine that streams incoming file directly to our Storage service (S3 or Local)
class ServiceStreamStorage implements StorageEngine {
  constructor() {}

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File> & { size?: number }) => void,
  ): void {
    try {
      const providedName = (req.body?.filename as string | undefined)?.trim();
      const category = (req.body?.category as string | undefined)?.trim() || 'uncategorized';
      const original = file.originalname?.replace(/\s+/g, '-') || 'upload.bin';
      const baseName = providedName && providedName.length > 0 ? providedName : original;
      const timestamp = Date.now();
      const key =
        `public/${category}/${timestamp}-${baseName}.${file.mimetype.split('/')[1]}`.replace(
          /\/+/,
          '/',
        );

      // file.stream is a Readable stream provided by Multer; stream it directly
      const storage = storageService.getStorage();
      storage
        .put(key, file.stream, file.mimetype)
        .then(async () => {
          // Optional: get a URL to return in response file info
          let signedUrl: string | undefined;
          try {
            signedUrl = await storage.getSignedUrl(key);
          } catch {
            /* ignore */
          }

          cb(null, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: (file as any).size,
            destination: undefined as any,
            filename: baseName,
            path: key,
            key: key as any,
            location: signedUrl as any,
          } as any);
        })
        .catch((err) => cb(err));
    } catch (err) {
      cb(err);
    }
  }

  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    // Nothing to do; caller can clean up via storage.delete if needed
    cb(null);
  }
}

export function createUpload() {
  const engine = new ServiceStreamStorage();
  return multer({ storage: engine });
}
