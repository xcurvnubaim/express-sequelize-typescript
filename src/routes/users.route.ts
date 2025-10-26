import { Router } from 'express';
import { container } from '../lib/internal/di-container';
import { TOKENS } from '../lib/internal/di-container';
import { UserController } from '../app/controllers/user.controller';

export function createUserRoutes(): Router {
  const router = Router();
  const userController = container.resolve<UserController>(TOKENS.UserController);

  // router.get('/', userController.getUsers);
  router.get('/:id', userController.getUserById);
  router.post('/login', userController.loginUser);
  router.post('/register', userController.registerUser);

  return router;
}
