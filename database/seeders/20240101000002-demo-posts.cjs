'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the user IDs to reference in posts
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No users found. Please run user seeder first.');
      return;
    }

    const posts = [
      {
        title: 'Getting Started with Node.js',
        body: 'Node.js is a powerful JavaScript runtime built on Chrome\'s V8 JavaScript engine. It allows developers to use JavaScript to write server-side code.',
        userId: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Understanding TypeScript',
        body: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing to the language.',
        userId: users[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Introduction to Express.js',
        body: 'Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.',
        userId: users[1].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Sequelize ORM Guide',
        body: 'Sequelize is a promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server. It features solid transaction support, relations, eager and lazy loading, and more.',
        userId: users[1].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Database Migrations Best Practices',
        body: 'Database migrations are a way to manage changes to your database schema over time. They help keep your database structure in sync across different environments.',
        userId: users[2].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'REST API Design Principles',
        body: 'RESTful APIs are designed around resources, which are any kind of object, data, or service that can be accessed by the client. Learn the core principles of REST.',
        userId: users[2].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Dependency Injection in TypeScript',
        body: 'Dependency Injection is a design pattern used to implement IoC (Inversion of Control). It allows the creation of dependent objects outside of a class and provides those objects to a class.',
        userId: users[3].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Working with AWS S3',
        body: 'Amazon S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance.',
        userId: users[4].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('posts', posts, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts', null, {});
  },
};
