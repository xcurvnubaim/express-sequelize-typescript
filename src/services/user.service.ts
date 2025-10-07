import { injectable, inject } from 'tsyringe';
import { BaseService } from './base.service';
import { UserRepository } from '../repositories/user.repository';
import { TOKENS } from '../lib/app/di-tokens';
import { User } from '../models/user.model';

@injectable()
export class UserService extends BaseService {
    constructor(
        @inject(TOKENS.UserRepository) private userRepository: UserRepository
    ) {
        super();
    }

    async getUserById(id: number): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.findAllWithPosts();
    }

    async createUser(data: Partial<User>): Promise<User> {
        return this.userRepository.create(data);
    }

    async updateUser(id: number, data: Partial<User>): Promise<boolean> {
        const [affectedCount] = await this.userRepository.update(id, data);
        return affectedCount > 0;
    }

    async deleteUser(id: number): Promise<boolean> {
        const deletedCount = await this.userRepository.delete(id);
        return deletedCount > 0;
    }
}
