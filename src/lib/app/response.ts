import { ApiErrorClass } from '../errors/api-error';
import type { StackFrame } from '../errors/stack-utils';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  meta?: Record<string, unknown>;
  data: T | null;
  error: StackFrame[] | null;
}

export const successResponse = <T>(message: string, data?: T, meta?: Record<string, unknown>): ApiResponse<T> => {
  return {
    success: true,
    message,
    meta,
    data: data !== undefined ? data : null,
    error: null,
  };
};

export const errorResponse = (message: string, error: ApiErrorClass | null): ApiResponse<null> => {
  const includeFramesDefault = process.env.NODE_ENV !== "production";
  return {
    success: false,
    message,
    data: null,
    error: error?.toJSON(includeFramesDefault).stackFrames || null,
  };
};
