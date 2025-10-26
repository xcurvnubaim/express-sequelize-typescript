import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.email('format email tidak valid'),
  name: z.string().min(3, 'minimal 3 karakter'),
  password: z.string().min(6, 'minimal 6 karakter'),
});

export type RegisterUserRequestDto = z.infer<typeof RegisterUserSchema>;

export type UserResponseDto = {
  email: string;
  name: string | null;
};

export const LoginUserSchema = z.object({
  email: z.email('format email tidak valid'),
  password: z.string().min(6, 'minimal 6 karakter'),
});

export type LoginUserRequestDto = z.infer<typeof LoginUserSchema>;

export type LoginUserResponseDto = {
  user: UserResponseDto;
  token: string;
};
