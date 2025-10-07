import { injectable, inject } from 'tsyringe';
import { BaseService } from './base.service';
import { PostRepository } from '../repositories/post.repository';
import { TOKENS } from '../lib/app/di-tokens';
import { Post } from '../models/post.model';

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

    async getAllPosts(): Promise<Post[]> {
        return this.postRepository.findAllWithUser();
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
