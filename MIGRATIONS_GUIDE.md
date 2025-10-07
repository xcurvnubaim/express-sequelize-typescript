# Database Migrations and Seeders Guide

This guide explains how to work with Sequelize migrations and seeders in this project.

## Prerequisites

- Make sure your database is running and accessible
- Ensure your `.env` file has the correct database credentials

## Available Commands

### Migrations

```bash
# Run all pending migrations
bun run db:migrate

# Undo the last migration
bun run db:migrate:undo

# Undo all migrations
bun run db:migrate:undo:all

# Check migration status
bun run db:migrate:status

# Create a new migration
bun run migration:create <migration-name>
```

### Seeders

```bash
# Run all seeders
bun run db:seed

# Undo the last seeder
bun run db:seed:undo

# Undo all seeders
bun run db:seed:undo:all

# Create a new seeder
bun run seed:create <seeder-name>
```

## How to Run Migrations

1. **Check current migration status:**
   ```bash
   bun run db:migrate:status
   ```

2. **Run all pending migrations:**
   ```bash
   bun run db:migrate
   ```

3. **If you need to rollback:**
   ```bash
   bun run db:migrate:undo
   ```

## How to Run Seeders

1. **First, make sure migrations are run:**
   ```bash
   bun run db:migrate
   ```

2. **Run all seeders:**
   ```bash
   bun run db:seed
   ```

3. **To undo seeders:**
   ```bash
   bun run db:seed:undo:all
   ```

## Creating New Migrations

### Step 1: Generate Migration File

```bash
bun run migration:create add-column-to-users
```

This will create a new file in `database/migrations/` with a timestamp prefix.

### Step 2: Edit the Migration File

Example migration to add a new column:

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phoneNumber', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'email', // MySQL only
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'phoneNumber');
  },
};
```

### Common Migration Operations

#### Add Column
```javascript
await queryInterface.addColumn('table_name', 'column_name', {
  type: Sequelize.STRING,
  allowNull: false,
});
```

#### Remove Column
```javascript
await queryInterface.removeColumn('table_name', 'column_name');
```

#### Change Column
```javascript
await queryInterface.changeColumn('table_name', 'column_name', {
  type: Sequelize.TEXT,
  allowNull: true,
});
```

#### Add Index
```javascript
await queryInterface.addIndex('table_name', ['column_name'], {
  name: 'custom_index_name',
  unique: true, // optional
});
```

#### Remove Index
```javascript
await queryInterface.removeIndex('table_name', 'index_name');
```

#### Create Table
```javascript
await queryInterface.createTable('table_name', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});
```

#### Drop Table
```javascript
await queryInterface.dropTable('table_name');
```

## Creating New Seeders

### Step 1: Generate Seeder File

```bash
bun run seed:create demo-products
```

This will create a new file in `database/seeders/`.

### Step 2: Edit the Seeder File

Example seeder:

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Product 1',
        price: 99.99,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Product 2',
        price: 149.99,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
```

## Current Seeders

### 1. Users Seeder (`20240101000001-demo-users.cjs`)
Creates 5 demo users:
- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com)
- Bob Johnson (bob.johnson@example.com)
- Alice Williams (alice.williams@example.com)
- Charlie Brown (charlie.brown@example.com)

### 2. Posts Seeder (`20240101000002-demo-posts.cjs`)
Creates 8 demo posts associated with the seeded users. Topics include:
- Node.js
- TypeScript
- Express.js
- Sequelize ORM
- Database Migrations
- REST API Design
- Dependency Injection
- AWS S3

## Workflow

### Development Workflow

1. **Initial Setup:**
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

2. **Making Schema Changes:**
   ```bash
   # Create new migration
   bun run migration:create your-migration-name
   
   # Edit the migration file
   # Then run it
   bun run db:migrate
   ```

3. **Fresh Start (Reset Database):**
   ```bash
   bun run db:seed:undo:all
   bun run db:migrate:undo:all
   bun run db:migrate
   bun run db:seed
   ```

### Production Workflow

1. **Never run seeders in production** unless they contain essential data
2. **Always backup your database** before running migrations
3. **Test migrations in staging** environment first
4. **Run migrations:**
   ```bash
   NODE_ENV=production bun run db:migrate
   ```

## Configuration

### Database Config Location
- **CLI Config:** `database/config.cjs` (used by sequelize-cli)
- **App Config:** `configs/database.ts` (used by your application)

### Sequelize RC
The `.sequelizerc` file defines paths:
```javascript
{
  'config': 'database/config.cjs',
  'migrations-path': 'database/migrations',
  'seeders-path': 'database/seeders',
  'models-path': 'src/models',
}
```

## Troubleshooting

### Migration Not Running
- Check migration status: `bun run db:migrate:status`
- Ensure database is accessible
- Check `.env` file for correct credentials

### Seeder Fails
- Ensure migrations are run first: `bun run db:migrate`
- Check for foreign key constraints
- Verify data format matches table schema

### Rollback Issues
- Check if other data depends on the data you're trying to remove
- Use `CASCADE` in foreign keys for automatic cleanup

## Best Practices

1. **Always include both `up` and `down` methods** in migrations
2. **Use timestamps** in migration filenames for ordering
3. **Test migrations** on a copy of production data
4. **Keep migrations atomic** - one logical change per migration
5. **Add indexes** for columns used in WHERE clauses
6. **Document complex migrations** with comments
7. **Use transactions** for multiple related operations
8. **Version control** all migration and seeder files

## Example: Complete Feature Migration

Adding a comments feature:

```javascript
// 20241007000001-create-comments.cjs
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('comments', ['postId']);
    await queryInterface.addIndex('comments', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('comments');
  },
};
```

## Quick Reference

| Task | Command |
|------|---------|
| Run migrations | `bun run db:migrate` |
| Rollback last migration | `bun run db:migrate:undo` |
| Check migration status | `bun run db:migrate:status` |
| Create migration | `bun run migration:create <name>` |
| Run seeders | `bun run db:seed` |
| Undo all seeders | `bun run db:seed:undo:all` |
| Create seeder | `bun run seed:create <name>` |
