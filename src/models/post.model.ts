import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import type { PostResponseDto } from '../app/dtos/post.dto';

@Table({
  tableName: 'posts',
  timestamps: true,
})
export class Post extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  body!: string;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @Column({
    type: DataType.DATE,
  })
  declare createdAt?: Date;

  @Column({
    type: DataType.DATE,
  })
  declare updatedAt?: Date;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
  })
  user?: typeof User;

  // Method Definition
  toResponseDto(): PostResponseDto {
    return {
      id: this.id,
      title: this.title,
      body: this.body,
      userId: this.userId,
    };
  }
}
