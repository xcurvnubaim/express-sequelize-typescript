import jwt from 'jsonwebtoken';

import type { PayloadToken, RequestWithAuth } from '../types/interfaces';
import type { NextFunction, Response } from 'express';
import { errorResponse } from '../lib/internal/response';
import { config } from '../../configs';

export const verifyToken = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json(errorResponse('Invalid token', null));
  }

  try {
    const [, tokenValue] = token.split(' ');
    const user = jwt.verify(
      tokenValue,
      config.app.SECRET_KEY || 'secret'
    ) as unknown as PayloadToken;
    req.user = user;
    next();
  } catch {
    return res.status(401).json(errorResponse('Invalid token', null));
  }
};
