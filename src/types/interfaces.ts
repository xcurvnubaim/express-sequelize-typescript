import type { Request } from 'express';

export type PayloadToken = {
  id: number;
  iat?: number;
  exp?: number;
};

export type RequestWithAuth = Request & {
  user?: PayloadToken;
};
