import { Sequelize } from "sequelize-typescript";
import type { DatabaseConfig } from "../../../configs/database";
import { User } from "../../models/user.model";
import { Post } from "../../models/post.model";

export const newDB = (config: DatabaseConfig) => {
    const sequelize = new Sequelize({
      dialect: config.DB_DIALECT,
      port: config.DB_PORT,
      database: config.DB_NAME,
      username: config.DB_USER,
      password: config.DB_PASSWORD,
      replication: {
        read: [
          {
            host: config.DB_HOST_READ,
          }
        ],
        write: {
          host: config.DB_HOST_WRITE,
        },
      },
      logging: true,
      pool: {
        max: 10,
        min: 1,
        acquire: 30000,
        idle: 10000
      },
      models: [User, Post], // Add all models here
    });

    return sequelize;
}