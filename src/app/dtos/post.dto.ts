import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type CreatePostRequestDto = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  userId: z.number().int().positive().optional(),
});

export type UpdatePostRequestDto = z.infer<typeof updatePostSchema>;

export type PostResponseDto = {
  id: number;
  title: string;
  body: string;
  userId: number;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
};

export type UploadedFileInfo = {
  key: string;
  url?: string;
  mimetype: string;
  size?: number;
  originalname: string;
  filename: string;
};

export type PostWithUploadsResponseDto = PostResponseDto & {
  uploads?: UploadedFileInfo[];
};
