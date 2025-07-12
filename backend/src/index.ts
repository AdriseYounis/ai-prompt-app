import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get("/api/health", (_req: Request, res: Response): void => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Example prompt endpoint
app.post("/api/prompt", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    // TODO: Add your AI processing logic here
    // For now, we'll just echo back the prompt
    const response = `Received prompt: ${prompt}\nThis is a placeholder response.`;

    res.json({ response });
  } catch (error) {
    console.error("Error processing prompt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
  },
);

// Graceful shutdown handler
const gracefulShutdown = (): void => {
  console.log("Received shutdown signal. Closing HTTP server...");
  process.exit(0);
};

// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const server = app.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${port}`,
  );
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`API available at http://localhost:${port}/api/prompt`);
});

export default server;
