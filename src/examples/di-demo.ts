import "reflect-metadata";
import { container, TOKENS, initializeContainer } from "../lib/app/di-container";
import { UserService } from "../services/user.service";
import { PostService } from "../services/post.service";

// Initialize container
initializeContainer();

// Demonstrate DI by resolving services
const userService = container.resolve<UserService>(TOKENS.UserService);
const postService = container.resolve<PostService>(TOKENS.PostService);

console.log("✅ Dependency Injection Container Initialized Successfully!");
console.log("✅ UserService resolved:", userService.constructor.name);
console.log("✅ PostService resolved:", postService.constructor.name);

// You can now use these services
// Example: const users = await userService.getAllUsers();
