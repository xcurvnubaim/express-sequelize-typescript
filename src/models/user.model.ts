import { Table, Model, Column, DataType, HasMany } from 'sequelize-typescript';
import { Post } from './post.model';

@Table({
  tableName: 'users',
  timestamps: true
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  })
  declare id: number;

  @Column({
    type: DataType.STRING(120),
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.DATE
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE
  })
  declare updatedAt: Date;

  @HasMany(() => Post, {
    foreignKey: 'userId',
    as: 'posts'
  })
  posts?: typeof Post[];
}

