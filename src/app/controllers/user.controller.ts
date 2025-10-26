import { injectable, inject } from 'tsyringe';
import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserService } from '../services/user.service';
import { TOKENS } from '../../lib/internal/di-tokens';
import { parseRequest } from '../../lib/internal/request';
import { LoginUserSchema, RegisterUserSchema } from '../dtos/user.dto';
import type { RequestWithAuth } from '../../types/interfaces';

@injectable()
export class UserController extends BaseController {
  constructor(@inject(TOKENS.UserService) private userService: UserService) {
    super();
  }

  getMe = this.asyncHandler(async (req: RequestWithAuth, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return this.sendError(res, 'Unauthorized', 401);
    }

    const user = await this.userService.getUserById(userId);
    if (!user) {
      return this.sendError(res, 'User not found', 404);
    }

    this.sendSuccess(res, user);
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

  registerUser = this.asyncHandler(async (req: Request, res: Response) => {
    const validatedData = parseRequest(RegisterUserSchema, req);
    const newUser = await this.userService.registerUser(validatedData);
    this.sendSuccess(res, newUser, 201);
  });

  loginUser = this.asyncHandler(async (req: Request, res: Response) => {
    const validatedData = parseRequest(LoginUserSchema, req);
    const data = await this.userService.loginUser(validatedData);
    this.sendSuccess(res, data);
  });
}
