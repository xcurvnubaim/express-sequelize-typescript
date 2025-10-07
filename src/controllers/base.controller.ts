import type { Request, Response, NextFunction } from 'express';

export abstract class BaseController {
    /**
     * Wrap async route handlers to catch errors
     */
    protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
        return (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Send a success response
     */
    protected sendSuccess(res: Response, data: any, statusCode: number = 200) {
        res.status(statusCode).json({
            success: true,
            data
        });
    }

    /**
     * Send an error response
     */
    protected sendError(res: Response, message: string, statusCode: number = 400) {
        res.status(statusCode).json({
            success: false,
            error: message
        });
    }
}
