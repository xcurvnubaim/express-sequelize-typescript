import { injectable, inject } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from './base.controller';
import { UserService } from '../services/user.service';
import { TOKENS } from '../lib/app/di-tokens';

// Inline validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Invalid email format').max(255),
});

const updateUserSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email('Invalid email format').max(255).optional(),
});

@injectable()
export class UserController extends BaseController {
    constructor(
        @inject(TOKENS.UserService) private userService: UserService
    ) {
        super();
    }

    getUsers = this.asyncHandler(async (req: Request, res: Response) => {
        const users = await this.userService.getAllUsers();
        this.sendSuccess(res, users);
    });

    getUserById = this.asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            return this.sendError(res, 'Invalid user ID', 400);
        }
        
        const user = await this.userService.getUserById(Number(id));
        
        if (!user) {
            return this.sendError(res, 'User not found', 404);
        }
        
        this.sendSuccess(res, user);
    });

    createUser = this.asyncHandler(async (req: Request, res: Response) => {
        // Validate request body
        const validatedData = createUserSchema.parse(req.body);
        
        const user = await this.userService.createUser(validatedData);
        this.sendSuccess(res, user, 201);
    });

    updateUser = this.asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            return this.sendError(res, 'Invalid user ID', 400);
        }
        
        // Validate request body
        const validatedData = updateUserSchema.parse(req.body);
        
        if (Object.keys(validatedData).length === 0) {
            return this.sendError(res, 'At least one field is required for update', 400);
        }
        
        const updated = await this.userService.updateUser(Number(id), validatedData);
        
        if (!updated) {
            return this.sendError(res, 'User not found or not updated', 404);
        }
        
        this.sendSuccess(res, { message: 'User updated successfully' });
    });

    deleteUser = this.asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            return this.sendError(res, 'Invalid user ID', 400);
        }
        
        const deleted = await this.userService.deleteUser(Number(id));
        
        if (!deleted) {
            return this.sendError(res, 'User not found', 404);
        }
        
        this.sendSuccess(res, { message: 'User deleted successfully' });
    });
}
