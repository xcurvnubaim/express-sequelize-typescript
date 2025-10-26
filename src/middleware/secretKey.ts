import { errorResponse } from '../lib/internal/response';
import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'crypto';

export const validateSecretKey = (req: Request, res: Response, next: NextFunction) => {
  const secretKey = req.headers['x-secret-key'];
  if (
    secretKey !==
    createHash('md5')
      .update(process.env.SECRET_KEY as string)
      .digest('base64')
  ) {
    return res.status(403).json(errorResponse('Forbidden: Invalid secret key', null));
  }
  next();
};
