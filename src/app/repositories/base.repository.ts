import { Transaction } from 'sequelize';
import type { FindOptions, WhereOptions, CreateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { Model, ModelCtor } from 'sequelize-typescript';
import type { MakeNullishOptional } from 'sequelize/lib/utils';

// Infer creation attributes from the model
export type InferCreationAttributes<T extends Model> = MakeNullishOptional<
  T['_creationAttributes']
>;

// Define generic type parameters to enhance type inference
export abstract class BaseRepository<
  T extends Model<T>,
  TCreationAttributes extends InferCreationAttributes<T> = InferCreationAttributes<T>,
> {
  protected model: ModelCtor<T>;
  protected sequelize: Sequelize;

  constructor(model: ModelCtor<T>, sequelize: Sequelize) {
    this.model = model;
    this.sequelize = sequelize;
  }

  async createTransaction<R>(fn: (t: Transaction) => Promise<R>): Promise<R> {
    return this.sequelize.transaction(fn);
  }

  async findById(id: number | string): Promise<T | null> {
    return this.model.findOne({
      where: { id } as WhereOptions<T>,
    });
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    return this.model.findAll(options);
  }

  async findOne(options?: FindOptions<T>): Promise<T | null> {
    return this.model.findOne(options);
  }

  async create(data: TCreationAttributes, options?: CreateOptions): Promise<T> {
    return this.model.create(data as TCreationAttributes, options);
  }

  async update(id: number | string, data: Partial<T>): Promise<[number]> {
    const [affectedCount] = await this.model.update(data, {
      where: { id } as WhereOptions<T>,
    });
    return [affectedCount];
  }

  async delete(id: number | string): Promise<number> {
    return this.model.destroy({
      where: { id } as WhereOptions<T>,
    });
  }

  async count(options?: FindOptions<T>): Promise<number> {
    return this.model.count(options);
  }

  async findAndCountAll(options: FindOptions<T>): Promise<{ rows: T[]; count: number }> {
    return this.model.findAndCountAll(options);
  }
}
