import type { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { ApiErrorClass } from '../lib/errors/api-error';
import { errorResponse } from '../lib/app/response';

/**
 * Validation options for request validation
 */
interface ValidationOptions {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Middleware factory for validating request data using Zod schemas
 * 
 * @param options - Object containing Zod schemas for body, params, and/or query
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import { z } from 'zod';
 * 
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().min(0).optional()
 * });
 * 
 * router.post('/users', validate({ body: userSchema }), createUser);
 * ```
 */
export const validate =
  (options: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if request body exists when body validation is required
      if (options.body && (!req.body || Object.keys(req.body).length === 0)) {
        const message = 'Request body is required';
        return res.status(400).json(errorResponse(message, new ApiErrorClass(message, 400)));
      }

      // Validate and parse body
      if (options.body) {
        req.body = options.body.parse(req.body);
      }

      // Validate and parse params
      if (options.params) {
        req.params = options.params.parse(req.params) as typeof req.params;
      }

      // Validate and parse query
      if (options.query) {
        req.query = options.query.parse(req.query) as typeof req.query;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into user-friendly messages
        const messages = error.issues.map(
          (err) => `${err.path.join('.')} ${err.message.toLowerCase()}`,
        );

        const message = `Validation error: ${messages.join(', ')}`;

        return res.status(400).json(errorResponse(message, new ApiErrorClass(message, 400, error)));
      }

      // Handle any other validation errors
      const message = 'Invalid request data format';
      return res
        .status(400)
        .json(errorResponse(message, new ApiErrorClass(message, 400, error as Error)));
    }
  };
