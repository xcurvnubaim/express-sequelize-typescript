import { Router } from 'express';
import { container } from '../lib/app/di-container';
import { TOKENS } from '../lib/app/di-container';
import { UserController } from '../controllers/user.controller';

export function createUserRoutes(): Router {
    const router = Router();
    const userController = container.resolve<UserController>(TOKENS.UserController);

    router.get('/', userController.getUsers);
    router.get('/:id', userController.getUserById);
    router.post('/', userController.createUser);
    router.put('/:id', userController.updateUser);
    router.delete('/:id', userController.deleteUser);

    return router;
}
