import { Router } from 'express';
import { container } from '../lib/app/di-container';
import { TOKENS } from '../lib/app/di-container';
import { PostController } from '../controllers/post.controller';

export function createPostRoutes(): Router {
    const router = Router();
    const postController = container.resolve<PostController>(TOKENS.PostController);

    router.get('/', postController.getPosts);
    router.get('/:id', postController.getPostById);
    router.get('/user/:userId', postController.getPostsByUserId);
    router.post('/', postController.createPost);
    router.put('/:id', postController.updatePost);
    router.delete('/:id', postController.deletePost);

    return router;
}
