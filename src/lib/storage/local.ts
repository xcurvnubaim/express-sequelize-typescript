import { createWriteStream, promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';

import type { Storage, BinaryLike, ListObject } from '.';

export type LocalStorageOptions = {
  rootDir: string;
  baseUrl?: string;
  defaultExpirySec?: number;
};

export class LocalStorage implements Storage {
  private root: string;
  private baseUrl?: string;

  constructor(private opts: LocalStorageOptions) {
    this.root = path.resolve(opts.rootDir);
    this.baseUrl = opts.baseUrl?.replace(/\/+$/, '');
  }

  async ensureReady(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
  }

  private safeJoin(key: string): string {
    const p = path.resolve(this.root, key.replace(/^\/+/, ''));
    if (!p.startsWith(this.root)) {
      throw new Error('Invalid key (path traversal)');
    }
    return p;
  }

  async put(key: string, body: BinaryLike): Promise<void> {
    const filePath = this.safeJoin(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (typeof body === 'string') {
      await fs.writeFile(filePath, body);
    } else if (body instanceof Buffer || body instanceof Uint8Array) {
      await fs.writeFile(filePath, body);
    } else {
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(filePath);
        (body as Readable).pipe(ws);
        ws.on('finish', () => resolve());
        ws.on('error', reject);
      });
    }
  }

  async getText(key: string): Promise<string> {
    const filePath = this.safeJoin(key);
    return fs.readFile(filePath, 'utf8');
  }

  async getStream(key: string): Promise<Readable> {
    const filePath = this.safeJoin(key);
    return createReadStream(filePath);
  }

  async getSignedUrl(key: string): Promise<string> {
    // For local, we can't cryptographically sign without extra infra.
    // We return a "public URL" if baseUrl is configured.
    if (!this.baseUrl) {
      // Fallback to file:// (mostly for debugging)
      return 'file://' + this.safeJoin(key);
    }
    return `${this.baseUrl}/${key.replace(/^\/+/, '')}`;
  }

  async list(prefix = ''): Promise<ListObject[]> {
    const dirPath = this.safeJoin(prefix);
    const results: ListObject[] = [];

    // If prefix points to a directory, recurse; if it points to a file, return that file
    const stat = await fs.stat(dirPath).catch(() => null);
    if (stat?.isFile()) {
      const rel = path.relative(this.root, dirPath).replace(/\\/g, '/');
      results.push({ key: rel, size: stat.size, lastModified: stat.mtime });
      return results;
    }

    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          await walk(full);
        } else if (e.isFile()) {
          const s = await fs.stat(full);
          const rel = path.relative(this.root, full).replace(/\\/g, '/');
          results.push({ key: rel, size: s.size, lastModified: s.mtime });
        }
      }
    };

    await walk(stat ? dirPath : this.root);
    // Filter by prefix logically if dir didn't exist and prefix is a "key prefix"
    if (!stat) {
      return results.filter((r) => r.key.startsWith(prefix.replace(/^\/+/, '')));
    }
    return results;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.safeJoin(key);
    await fs.rm(filePath, { force: true });
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.delete(k)));
  }
}
