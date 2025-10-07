export interface ApiError {
  statusCode: number;
  message: string;
  stack?: string;
  cause?: Error;
}

export class ApiErrorClass extends Error implements ApiError {
  statusCode: number;
  cause?: Error;

  constructor(message: string, statusCode: number, cause?: Error) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.cause = cause;
    if (cause && cause.stack) {
      this.stack = (this.stack ?? '') + '\nCaused by: ' + cause.stack;
    }
  }

  /**
   * Returns the error chain as a list, starting from this error.
   */
  getErrorChain(): ApiErrorClass[] {
    const errors: ApiErrorClass[] = [this];
    let currentError = this.cause instanceof ApiErrorClass ? this.cause : undefined;
    while (currentError) {
      errors.push(currentError);
      currentError = currentError.cause instanceof ApiErrorClass ? currentError.cause : undefined;
    }
    return errors.reverse(); // Reverse to get the chain in the correct POST
  }
}
