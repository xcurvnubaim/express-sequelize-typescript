import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { errorResponse } from '../lib/response';
import { RequestWithAuth, UserTokenPayload } from '../types/interfaces';

export const verifyToken = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json(errorResponse('Invalid token', null));
  }

  try {
    const [, tokenValue] = token.split(' ');
    const user = jwt.verify(
      tokenValue,
      process.env.SECRET_KEY || 'secret'
    ) as unknown as UserTokenPayload;
    req.user = user;
    next();
  } catch {
    return res.status(401).json(errorResponse('Invalid token', null));
  }
};
