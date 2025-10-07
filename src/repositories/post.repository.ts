import { Sequelize } from "sequelize-typescript";
import { injectable, inject } from "tsyringe";
import { Post } from "../models/post.model";
import { BaseRepository } from "./base.repository";
import { Op } from "sequelize";
import { TOKENS } from "../lib/app/di-tokens";
import { User } from "../models/user.model";

@injectable()
export class PostRepository extends BaseRepository<Post> {
  constructor(@inject(TOKENS.Sequelize) sequelize: Sequelize) {
    super(Post, sequelize);
  }

  async findByUserId(userId: number): Promise<Post[]> {
    return this.findAll({ where: { userId } });
  }

  async findAllWithUser(): Promise<Post[]> {
    return this.findAll({ include: [User] });
  }

  async findByTitle(title: string): Promise<Post[]> {
    return this.findAll({
      where: {
        title: {
          [Op.like]: `%${title}%`,
        },
      },
    });
  }
}
