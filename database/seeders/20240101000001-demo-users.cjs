'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await Bun.hash('password', { algorithm: 'bcrypt' });
    await queryInterface.bulkInsert('users', [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Alice Williams',
        email: 'alice.williams@example.com',
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Charlie Brown',
        email: 'charlie.brown@example.com',
        password: password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
