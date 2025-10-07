import "./lib/app/reflect-metadata"; // Import this first
import express from "express";
import { config } from "../configs";
import { initializeContainer } from "./lib/app/di-container";
import { createLogger } from "./lib/app/logger";
import { createUserRoutes } from "./routes/users.route";
import { createPostRoutes } from "./routes/posts.route";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";

const logger = createLogger(config.logging);

logger.info("App starting", { env: process.env.APP_ENV || "development" });

// Initialize the DI container
initializeContainer();
logger.info("Dependency injection container initialized");

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', createUserRoutes());
app.use('/api/posts', createPostRoutes());

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(globalErrorHandler);

// Start server
const PORT = config.app.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export default app;
