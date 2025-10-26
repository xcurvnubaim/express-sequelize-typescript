import { Router } from 'express';
import { container } from '../lib/internal/di-container';
import { TOKENS } from '../lib/internal/di-container';
import { PostController } from '../app/controllers/post.controller';
import { uploadArray } from '../middleware/upload';

export function createPostRoutes(): Router {
  const router = Router();
  const postController = container.resolve<PostController>(TOKENS.PostController);

  router.get('/', postController.getPosts);
  router.get('/:id', postController.getPostById);
  router.get('/user/:userId', postController.getPostsByUserId);
  // Accept up to 5 files on field name "files"; files are handled in service layer
  router.post('/', uploadArray('files', 5), postController.createPost);
  router.put('/:id', postController.updatePost);
  router.delete('/:id', postController.deletePost);

  return router;
}
