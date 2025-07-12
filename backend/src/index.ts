import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Prompt from "./models/Prompt";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/ai_prompt_app?authSource=admin";

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// Basic health check endpoint
app.get("/api/health", (_req: Request, res: Response): void => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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

    // Save the prompt and response to the database
    try {
      const newPrompt = new Prompt({
        prompt,
        response: "This is a placeholder response.",
      });
      await newPrompt.save();
      console.log("Prompt saved to database with ID:", newPrompt._id);
    } catch (dbError) {
      console.error("Error saving prompt to database:", dbError);
      // Continue even if database save fails
    }

    res.json({ response: "This is a placeholder response." });
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
  console.log(
    "Received shutdown signal. Closing HTTP server and MongoDB connection...",
  );
  mongoose.connection.close(false).then(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
};

// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Get all prompts
app.get("/api/prompts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const prompts = await Prompt.find().sort({ createdAt: -1 }).limit(10);
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get MongoDB status
app.get(
  "/api/db-status",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const status = {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: await mongoose.connection.db.listCollections().toArray(),
      };
      res.json(status);
    } catch (error) {
      console.error("Error fetching database status:", error);
      res.status(500).json({
        error: "Error fetching database status",
        connected: false,
        state: mongoose.connection.readyState,
      });
    }
  },
);

// Start server
const server = app.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${port}`,
  );
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`API available at http://localhost:${port}/api/prompt`);
  console.log(`Prompts history: http://localhost:${port}/api/prompts`);
  console.log(`Database status: http://localhost:${port}/api/db-status`);
});

export default server;
