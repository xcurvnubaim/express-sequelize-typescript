export interface DatabaseConfig {
    DB_DIALECT: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql';
    DB_HOST_READ: string;
    DB_HOST_WRITE: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
}

export const databases : Record<string, DatabaseConfig> = {
    user: {
        DB_DIALECT: "mysql",
        DB_HOST_READ: process.env.DB_HOST_READ_USER || 'localhost',
        DB_HOST_WRITE: process.env.DB_HOST_WRITE_USER || 'localhost',
        DB_PORT: Number(process.env.DB_PORT_USER) || 5432,
        DB_USER: process.env.DB_USER_USER || 'user',
        DB_PASSWORD: process.env.DB_PASSWORD_USER || 'password',
        DB_NAME: process.env.DB_NAME_USER || 'database',
    },
    post: {
        DB_DIALECT: "mysql",
        DB_HOST_READ: process.env.DB_HOST_READ_POST || 'localhost',
        DB_HOST_WRITE: process.env.DB_HOST_WRITE_POST || 'localhost',
        DB_PORT: Number(process.env.DB_PORT_POST) || 5432,
        DB_USER: process.env.DB_USER_POST || 'user',
        DB_PASSWORD: process.env.DB_PASSWORD_POST || 'password',
        DB_NAME: process.env.DB_NAME_POST || 'POST_database',
    },
}