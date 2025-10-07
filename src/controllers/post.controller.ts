import { injectable, inject } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from './base.controller';
import { PostService } from '../services/post.service';
import { TOKENS } from '../lib/app/di-tokens';

@injectable()
export class PostController extends BaseController {
    constructor(
        @inject(TOKENS.PostService) private postService: PostService
    ) {
        super();
    }

    getPosts = this.asyncHandler(async (req: Request, res: Response) => {
        const posts = await this.postService.getAllPosts();
        this.sendSuccess(res, posts);
    });

    getPostsWithUser = this.asyncHandler(async (req: Request, res: Response) => {
        const posts = await this.postService.getAllPostsWithUser();
        this.sendSuccess(res, posts);
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
        // Validate request body
        const createPostSchema = z.object({
            title: z.string().min(1, 'Title is required').max(200),
            body: z.string().min(1, 'Body is required'),
        });
        const validatedData = createPostSchema.parse(req.body);
        
        const post = await this.postService.createPost(validatedData);
        this.sendSuccess(res, post, 201);
    });

    updatePost = this.asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        
        if (!id || isNaN(Number(id))) {
            return this.sendError(res, 'Invalid post ID', 400);
        }
        
        // Validate request body
        const updatePostSchema = z.object({
            title: z.string().min(1).max(200).optional(),
            body: z.string().min(1).optional(),
            userId: z.number().int().positive().optional(),
        });
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
