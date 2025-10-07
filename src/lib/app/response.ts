import { ApiError, ApiErrorClass } from './error';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiError | null;
  errorStack?: ApiError[];
}

export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => {
  return {
    success: true,
    message,
    data: data !== undefined ? data : null,
    error: null,
  };
};

export const errorResponse = (message: string, error: ApiErrorClass | null): ApiResponse<null> => {
  const errorStack = error instanceof ApiErrorClass ? error.getErrorChain() : undefined;

  return {
    success: false,
    message,
    data: null,
    error,
    errorStack,
  };
};
