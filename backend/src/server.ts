import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import routes from "./routes";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

let client: MongoClient;
let db: ReturnType<MongoClient["db"]>;

export const connectDB = async (): Promise<void> => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("ai_prompt_app"); // Your DB name here

    console.log(`URL ${MONGODB_URI}`);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Provide a way for routes to access the db instance
export const getDB = () => {
  if (!db) {
    throw new Error("MongoDB not connected yet");
  }
  return db;
};

// Mount all routes
app.use(routes);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    console.error("❌ Unhandled error:", err.stack);
    res.status(500).json({ error: "Something broke!" });
  },
);

// Graceful shutdown
const gracefulShutdown = (): void => {
  console.log("🛑 Shutdown signal received. Closing resources...");
  client.close(false).then(() => {
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
    console.log(`🧠 Smart search: http://localhost:${port}/api/smart-search`);
    console.log(`🔧 Smart prompt: http://localhost:${port}/api/smart-prompt`);
    console.log(
      `📊 Embedding stats: http://localhost:${port}/api/embedding-stats`,
    );
    console.log(
      `🔄 Migrate embeddings: http://localhost:${port}/api/migrate-embeddings`,
    );

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "⚠️  OPENAI_API_KEY not found. Smart search features will not work.",
      );
    } else {
      console.log("✅ OpenAI API key configured");
    }
  });
});
