import { Request } from 'express';
import { z, ZodType } from 'zod';

import { RequestWithAuth } from '../types/interfaces';

export function parseRequest<T extends ZodType>(schema: T, req: Request): z.infer<T> {
  const body = schema.parse(req.body);

  const user = (req as RequestWithAuth).user;
  if (user) {
    (body as any).user = user;
  }

  return body;
}
