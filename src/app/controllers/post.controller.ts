import { injectable, inject } from 'tsyringe';
import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { PostService } from '../services/post.service';
import { TOKENS } from '../../lib/internal/di-tokens';
import { parseQueryFromRequest } from '../../lib/query/queryBuilder';
import { validateQueryParams, type ValidateFields } from '../../lib/query/queryValidator';
import { createPostSchema, updatePostSchema } from '../dtos/post.dto';

@injectable()
export class PostController extends BaseController {
  constructor(@inject(TOKENS.PostService) private postService: PostService) {
    super();
  }

  getPosts = this.asyncHandler(async (req: Request, res: Response) => {
    const baseOpts = parseQueryFromRequest(req);

    const rules: ValidateFields = {
      sortColumns: ['id', 'title', 'createdAt', 'updatedAt'],
      sortDir: ['asc', 'desc'],
      filters: [
        { field: 'title', allow: { contains: true } },
        { field: 'userId', allow: { equals: true } },
        { field: 'createdAt', allow: { range: { gte: true, lte: true } } },
      ],
      searchColumns: ['title', 'body'],
      maxPageSize: 100,
    };

    validateQueryParams(baseOpts, rules);

    const posts = await this.postService.getAllPosts(baseOpts);
    this.sendSuccess(res, posts.data, 200, posts.meta);
  });

  getPostById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return this.sendError(res, 'Invalid post ID', 400);
    }

    const post = await this.postService.getPostById(Number(id));

    if (!post) {
      return this.sendError(res, 'Post not found', 404);
    }

    this.sendSuccess(res, post);
  });

  getPostsByUserId = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId || isNaN(Number(userId))) {
      return this.sendError(res, 'Invalid user ID', 400);
    }

    const posts = await this.postService.getPostsByUserId(Number(userId));
    this.sendSuccess(res, posts);
  });

  createPost = this.asyncHandler(async (req: Request, res: Response) => {
    // Multer memory storage populates text fields in req.body and files in req.files/req.file
    const validatedData = createPostSchema.parse({
      ...req.body,
      userId: req.body?.userId ? Number(req.body.userId) : undefined,
    });

    const files =
      (req.files as Express.Multer.File[] | undefined) || (req.file ? [req.file] : undefined);

    const result = await this.postService.createPost(validatedData, files);
    this.sendSuccess(res, result, 201);
  });

  updatePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return this.sendError(res, 'Invalid post ID', 400);
    }

    const validatedData = updatePostSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      return this.sendError(res, 'At least one field is required for update', 400);
    }

    const updated = await this.postService.updatePost(Number(id), validatedData);

    if (!updated) {
      return this.sendError(res, 'Post not found or not updated', 404);
    }

    this.sendSuccess(res, { message: 'Post updated successfully' });
  });

  deletePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return this.sendError(res, 'Invalid post ID', 400);
    }

    const deleted = await this.postService.deletePost(Number(id));

    if (!deleted) {
      return this.sendError(res, 'Post not found', 404);
    }

    this.sendSuccess(res, { message: 'Post deleted successfully' });
  });
}
