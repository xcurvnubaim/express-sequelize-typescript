import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { injectable, inject } from 'tsyringe';
import { User } from '../../models/user.model';
import { BaseRepository } from './base.repository';
import { TOKENS } from '../../lib/internal/di-tokens';
import { Post } from '../../models/post.model';

@injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@inject(TOKENS.SequelizeUser) sequelize: Sequelize) {
    super(User, sequelize);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Typed where clause - autocomplete will work here
    return this.findOne({
      where: {
        email,
      },
    });
  }

  async findAllWithPosts(): Promise<User[]> {
    return this.findAll({
      include: [Post],
    });
  }

  async findByName(name: string): Promise<User[]> {
    // TypeScript will now provide auto-completion for all User model fields
    return this.findAll({
      where: {
        name,
      },
    });
  }

  async findWithFilters(filters: Partial<User>): Promise<User[]> {
    // This method demonstrates using a dynamic filter object
    return this.findAll({
      where: filters,
    });
  }

  async searchByNamePattern(pattern: string): Promise<User[]> {
    // Advanced example with operators - autocomplete works for field names
    return this.findAll({
      where: {
        name: {
          [Op.like]: `%${pattern}%`, // LIKE search
        },
      },
    });
  }

  async findByNameOrEmail(term: string): Promise<User[]> {
    // Complex query with multiple conditions and operators
    return this.findAll({
      where: {
        [Op.or]: [{ name: { [Op.like]: `%${term}%` } }, { email: { [Op.like]: `%${term}%` } }],
      },
    });
  }
}
