import type { Request } from 'express';

export type PayloadToken = {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
};

export type RequestWithAuth = Request & {
  user?: PayloadToken;
};
