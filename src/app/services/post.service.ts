import { injectable, inject } from 'tsyringe';
import { BaseService, type PaginationResponse } from './base.service';
import { PostRepository } from '../repositories/post.repository';
import { TOKENS } from '../../lib/internal/di-tokens';
import { Post } from '../../models/post.model';
import type { BuildQueryOptions } from '../../lib/query/sequelizeQuery';
import { buildSequelizeQuery } from '../../lib/query/sequelizeQuery';
import { ApiErrorClass } from '../../lib/errors/api-error';
import type {
  CreatePostRequestDto,
  PostResponseDto,
  PostWithUploadsResponseDto,
  UploadedFileInfo,
} from '../dtos/post.dto';
import type { Storage } from '../../lib/storage';

@injectable()
export class PostService extends BaseService {
  constructor(
    @inject(TOKENS.PostRepository) private postRepository: PostRepository,
    @inject(TOKENS.Storage) private storage: Storage
  ) {
    super();
  }

  async getPostById(id: number): Promise<Post | null> {
    this.logger.info(`Fetching post with ID: ${id}`);
    return this.postRepository.findById(id);
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    this.logger.info(`Fetching posts for user ID: ${userId}`);
    return this.postRepository.findByUserId(userId);
  }

  async getAllPosts(baseOpts: BuildQueryOptions): Promise<PaginationResponse<PostResponseDto>> {
    try {
      this.logger.info('Fetching all posts with options:', baseOpts);
      const page = baseOpts.pagination?.page || 1;
      const pageSize = baseOpts.pagination?.pageSize || 10;

      // Build the actual Sequelize query from the options
      const queryOptions = buildSequelizeQuery(baseOpts);

      const { rows: posts, count: totalItems } =
        await this.postRepository.findAndCountAll(queryOptions);

      const totalPages = Math.ceil(totalItems / pageSize);
      return {
        meta: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages,
        },
        data: posts.map((post) => post.toResponseDto()),
      };
    } catch (error) {
      throw new ApiErrorClass('Failed to get posts', 500, { cause: error });
    }
  }

  async getAllPostsWithUser(): Promise<Post[]> {
    return this.postRepository.findAllWithUser();
  }

  async createPost(
    data: CreatePostRequestDto,
    files?: Express.Multer.File[]
  ): Promise<PostWithUploadsResponseDto> {
    const post = await this.postRepository.create({
      title: data.title,
      body: data.body,
      userId: data.userId,
    });

    const baseDto = post.toResponseDto();

    if (!files || files.length === 0) {
      return baseDto;
    }

    const uploads: UploadedFileInfo[] = [];

    for (const file of files) {
      const safeOriginal = (file.originalname || 'upload.bin').replace(/\s+/g, '-');
      const ext = file.mimetype?.split('/')?.[1] || 'bin';
      const key = `public/posts/${Date.now()}-${safeOriginal}.${ext}`.replace(/\/+/, '/');

      await this.storage.put(key, file.buffer, file.mimetype);

      let url: string | undefined;
      try {
        url = await this.storage.getSignedUrl(key);
      } catch {
        // signed URL may not be supported on local storage
      }

      uploads.push({
        key,
        url,
        mimetype: file.mimetype,
        size: file.size,
        originalname: file.originalname,
        filename: safeOriginal,
      });
    }

    return { ...baseDto, uploads };
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
