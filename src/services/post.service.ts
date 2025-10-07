import { injectable, inject } from 'tsyringe';
import { BaseService, type PaginationResponse } from './base.service';
import { PostRepository } from '../repositories/post.repository';
import { TOKENS } from '../lib/app/di-tokens';
import { Post } from '../models/post.model';
import type { BuildQueryOptions } from '../lib/query/sequelizeQuery';
import { buildSequelizeQuery } from '../lib/query/sequelizeQuery';
import { ApiErrorClass } from '../lib/errors/api-error';

@injectable()
export class PostService extends BaseService {
    constructor(
        @inject(TOKENS.PostRepository) private postRepository: PostRepository
    ) {
        super();
    }

    async getPostById(id: number): Promise<Post | null> {
        return this.postRepository.findById(id);
    }

    async getPostsByUserId(userId: number): Promise<Post[]> {
        return this.postRepository.findByUserId(userId);
    }

    async getAllPosts(baseOpts: BuildQueryOptions): Promise<PaginationResponse<Post>> {
        try{
            const page = baseOpts.pagination?.page || 1;
            const pageSize = baseOpts.pagination?.pageSize || 10;
            
            // Build the actual Sequelize query from the options
            const queryOptions = buildSequelizeQuery(baseOpts);

            const { rows: posts, count: totalItems } = await this.postRepository.findAndCountAll(queryOptions);
            
            const totalPages = Math.ceil(totalItems / pageSize);
            return {
                meta: {
                    currentPage: page,
                    pageSize,
                    totalItems,
                    totalPages,
                },
                data: posts
            };
        } catch (error) {
            throw new ApiErrorClass('Failed to get posts', 500, { cause: error });
        }
    }

    async getAllPostsWithUser(): Promise<Post[]> {
        return this.postRepository.findAllWithUser();
    }

    async createPost(data: Partial<Post>): Promise<Post> {
        return this.postRepository.create(data);
    }

    async updatePost(id: number, data: Partial<Post>): Promise<boolean> {
        const [affectedCount] = await this.postRepository.update(id, data);
        return affectedCount > 0;
    }

    async deletePost(id: number): Promise<boolean> {
        const deletedCount = await this.postRepository.delete(id);
        return deletedCount > 0;
    }
}
