import { Transaction } from 'sequelize';
import type { FindOptions, WhereOptions, CreateOptions, InstanceUpdateOptions, DestroyOptions, NonAttribute } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { Model, ModelCtor } from 'sequelize-typescript';

// Define generic type parameters to enhance type inference
export abstract class BaseRepository<T extends Model<T>> {
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
            where: { id } as WhereOptions<T>
        });
    }

    async findAll(options?: FindOptions<T>): Promise<T[]> {
        return this.model.findAll(options);
    }

    async findOne(options: FindOptions<T>): Promise<T | null> {
        return this.model.findOne(options);
    }

    async create(data: any, options?: CreateOptions): Promise<T> {
        return this.model.create(data, options);
    }

    async update(id: number | string, data: Partial<T>): Promise<[number]> {
        const [affectedCount] = await this.model.update(data, { 
            where: { id } as WhereOptions<T>
        });
        return [affectedCount];
    }

    async delete(id: number | string): Promise<number> {
        return this.model.destroy({ 
            where: { id } as WhereOptions<T> 
        });
    }

    async count(options?: FindOptions<T>): Promise<number> {
        return this.model.count(options);
    }

    async findAndCountAll(options: FindOptions<T>): Promise<{ rows: T[]; count: number }> {
        return this.model.findAndCountAll(options);
    }
}