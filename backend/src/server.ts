import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// Mount all routes
app.use(routes);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`URL ${process.env.MONGODB_URI?.toString()}`);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response): void => {
  console.error("❌ Unhandled error:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Graceful shutdown
const gracefulShutdown = (): void => {
  console.log("🛑 Shutdown signal received. Closing resources...");
  mongoose.connection.close(false).then(() => {
    console.log("✅ MongoDB connection closed.");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server after DB connection
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🔍 Health: http://localhost:${port}/api/health`);
    console.log(`📥 Prompt POST: http://localhost:${port}/api/prompt`);
    console.log(`📜 Prompt list: http://localhost:${port}/api/prompts`);
  });
});
