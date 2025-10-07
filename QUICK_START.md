# Quick Start Guide - Dependency Injection

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Application
```bash
bun run src/index.ts
```

The server will start on port 3000 (or your configured port).

## 📝 Quick Reference

### Creating a New Feature

#### Step 1: Create Repository
```typescript
// src/repositories/product.repository.ts
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';
import { Sequelize } from 'sequelize-typescript';
import { BaseRepository } from './base.repository';
import { Product } from '../models/product.model';

@injectable()
export class ProductRepository extends BaseRepository<Product> {
    constructor(@inject(TOKENS.Sequelize) sequelize: Sequelize) {
        super(Product, sequelize);
    }

    // Add custom methods
    async findByCategory(category: string): Promise<Product[]> {
        return this.findAll({ where: { category } });
    }
}
```

#### Step 2: Create Service
```typescript
// src/services/product.service.ts
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';
import { BaseService } from './base.service';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../models/product.model';

@injectable()
export class ProductService extends BaseService {
    constructor(
        @inject(TOKENS.ProductRepository) private productRepository: ProductRepository
    ) {
        super();
    }

    async getAllProducts(): Promise<Product[]> {
        return this.productRepository.findAll();
    }

    async getProductsByCategory(category: string): Promise<Product[]> {
        return this.productRepository.findByCategory(category);
    }

    async createProduct(data: Partial<Product>): Promise<Product> {
        // Add business logic here
        return this.productRepository.create(data);
    }
}
```

#### Step 3: Create Controller
```typescript
// src/controllers/product.controller.ts
import { injectable, inject } from 'tsyringe';
import type { Request, Response } from 'express';
import { TOKENS } from '../lib/app/di-container';
import { BaseController } from './base.controller';
import { ProductService } from '../services/product.service';

@injectable()
export class ProductController extends BaseController {
    constructor(
        @inject(TOKENS.ProductService) private productService: ProductService
    ) {
        super();
    }

    getProducts = this.asyncHandler(async (req: Request, res: Response) => {
        const products = await this.productService.getAllProducts();
        this.sendSuccess(res, products);
    });

    getProductsByCategory = this.asyncHandler(async (req: Request, res: Response) => {
        const { category } = req.params;
        const products = await this.productService.getProductsByCategory(category);
        this.sendSuccess(res, products);
    });

    createProduct = this.asyncHandler(async (req: Request, res: Response) => {
        const product = await this.productService.createProduct(req.body);
        this.sendSuccess(res, product, 201);
    });
}
```

#### Step 4: Add Tokens to DI Container
```typescript
// src/lib/app/di-container.ts

// Add to TOKENS object
export const TOKENS = {
    // ...existing tokens...
    ProductRepository: Symbol.for("ProductRepository"),
    ProductService: Symbol.for("ProductService"),
    ProductController: Symbol.for("ProductController"),
}

// Add to initializeContainer function
export function initializeContainer(): void {
    // ...existing registrations...
    
    container.register(TOKENS.ProductRepository, { useClass: ProductRepository });
    container.register(TOKENS.ProductService, { useClass: ProductService });
    container.register(TOKENS.ProductController, { useClass: ProductController });
}
```

#### Step 5: Create Routes
```typescript
// src/routes/products.route.ts
import { Router } from 'express';
import { container } from '../lib/app/di-container';
import { TOKENS } from '../lib/app/di-container';
import { ProductController } from '../controllers/product.controller';

export function createProductRoutes(): Router {
    const router = Router();
    const productController = container.resolve<ProductController>(TOKENS.ProductController);

    router.get('/', productController.getProducts);
    router.get('/category/:category', productController.getProductsByCategory);
    router.post('/', productController.createProduct);

    return router;
}
```

#### Step 6: Register Routes in App
```typescript
// src/index.ts

import { createProductRoutes } from './routes/products.route';

// In your app setup
app.use('/api/products', createProductRoutes());
```

## 🧪 Testing Examples

### Unit Testing a Service
```typescript
import { container } from 'tsyringe';
import { TOKENS } from '../lib/app/di-container';
import { ProductService } from '../services/product.service';

describe('ProductService', () => {
    let service: ProductService;
    let mockRepository: any;

    beforeEach(() => {
        // Create mock repository
        mockRepository = {
            findAll: jest.fn(),
            create: jest.fn(),
        };

        // Register mock in container
        container.register(TOKENS.ProductRepository, { 
            useValue: mockRepository 
        });

        // Resolve service (it will get the mock repository)
        service = container.resolve<ProductService>(TOKENS.ProductService);
    });

    it('should get all products', async () => {
        const mockProducts = [{ id: 1, name: 'Product 1' }];
        mockRepository.findAll.mockResolvedValue(mockProducts);

        const result = await service.getAllProducts();

        expect(result).toEqual(mockProducts);
        expect(mockRepository.findAll).toHaveBeenCalled();
    });
});
```

### Integration Testing a Controller
```typescript
import request from 'supertest';
import app from '../index';

describe('Product API', () => {
    it('GET /api/products should return products', async () => {
        const response = await request(app)
            .get('/api/products')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/products should create product', async () => {
        const newProduct = {
            name: 'Test Product',
            price: 99.99,
            category: 'Electronics'
        };

        const response = await request(app)
            .post('/api/products')
            .send(newProduct)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(newProduct.name);
    });
});
```

## 🎯 Common Patterns

### Injecting Multiple Dependencies
```typescript
@injectable()
export class POSTService {
    constructor(
        @inject(TOKENS.POSTRepository) private POSTRepo: POSTRepository,
        @inject(TOKENS.ProductService) private productService: ProductService,
        @inject(TOKENS.UserService) private userService: UserService
    ) {}
}
```

### Using Base Controller Methods
```typescript
// Success response
this.sendSuccess(res, data, 200);

// Error response
this.sendError(res, 'Not found', 404);

// Async error handling
myMethod = this.asyncHandler(async (req, res) => {
    // Errors automatically caught and passed to error middleware
});
```

### Transaction Support
```typescript
// In your service
async createPOSTWithItems(POSTData: any, items: any[]) {
    return this.POSTRepository.createTransaction(async (transaction) => {
        const POST = await this.POSTRepository.create(POSTData, { transaction });
        
        for (const item of items) {
            await this.POSTItemRepository.create(
                { ...item, POSTId: POST.id },
                { transaction }
            );
        }
        
        return POST;
    });
}
```

## 📚 API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/with-user` - Get posts with user details
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/user/:userId` - Get posts by user ID
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Health
- `GET /health` - Health check

## 🐛 Troubleshooting

### Container errors
**Problem**: `Cannot resolve dependency`
**Solution**: Make sure the class is decorated with `@injectable()` and registered in the container

### Circular dependencies
**Problem**: `Circular dependency detected`
**Solution**: Use `@inject()` with lazy resolution or refactor to remove circular dependency

### Missing decorators
**Problem**: Decorators not working
**Solution**: Ensure `experimentalDecorators` and `emitDecoratorMetadata` are enabled in `tsconfig.json`

## 📖 Additional Resources

- `DI_SUMMARY.md` - Complete summary of what was implemented
- `DI_IMPLEMENTATION.md` - Detailed implementation guide
- `ARCHITECTURE.md` - Visual architecture diagrams
- `EXAMPLE_DI_FLOW.ts` - Complete code example

## 💡 Tips

1. Always use arrow functions in controllers to maintain `this` context
2. Register singletons for shared resources (like Sequelize)
3. Use tokens instead of class names for better type safety
4. Test with mocks to isolate units
5. Keep business logic in services, not controllers
6. Use base classes for common functionality

Happy coding! 🎉
