import { injectable, inject } from 'tsyringe';
import { BaseService } from './base.service';
import { UserRepository } from '../repositories/user.repository';
import { TOKENS } from '../../lib/internal/di-tokens';
import { User } from '../../models/user.model';
import type {
  LoginUserRequestDto,
  LoginUserResponseDto,
  RegisterUserRequestDto,
  UserResponseDto,
} from '../dtos/user.dto';
import jwt from 'jsonwebtoken';
import { type PayloadToken } from '../../types/interfaces';
import { config } from '../../../configs';
import Bun from 'bun';

@injectable()
export class UserService extends BaseService {
  constructor(@inject(TOKENS.UserRepository) private userRepository: UserRepository) {
    super();
  }

  async hashPassword(password: string): Promise<string> {
    // In a real application, use a library like bcrypt to hash passwords
    return Bun.password.hash(password, { algorithm: 'bcrypt' });
  }

  async verifyHashedPassword(password: string, hashedPassword: string): Promise<boolean> {
    // In a real application, use a library like bcrypt to verify hashed passwords
    return Bun.password.verify(password, hashedPassword);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async registerUser(data: RegisterUserRequestDto): Promise<UserResponseDto> {
    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
    return user.toResponseDto();
  }

  async loginUser(data: LoginUserRequestDto): Promise<LoginUserResponseDto> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user || !(await this.verifyHashedPassword(data.password, user.password))) {
      throw new Error('Invalid email or password');
    }
    const token = jwt.sign({ id: user.id } as PayloadToken, config.app.SECRET_KEY, {
      expiresIn: '1d',
    });
    return {
      user: user.toResponseDto(),
      token,
    };
  }
}
