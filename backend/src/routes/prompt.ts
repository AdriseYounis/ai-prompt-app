import { Router, Request, Response } from "express";
import { getDB } from "../server";

const router = Router();

router.post("/prompt", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const db = getDB();
    const promptsCollection = db.collection("prompts");

    const newPrompt = {
      prompt,
      response: "This is a placeholder response.",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await promptsCollection.insertOne(newPrompt);
    console.log("Prompt saved with ID:", result.insertedId);

    res.json({ response: result.insertedId.toString() });
  } catch (error) {
    console.error("Error saving prompt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prompts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDB();
    const promptsCollection = db.collection("prompts");

    const prompts = await promptsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log("Retrieved prompts:", prompts.length);
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
