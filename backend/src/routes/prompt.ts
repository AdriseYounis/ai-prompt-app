import { Router, Request, Response } from "express";
import Prompt from "../models/Prompt";

const router = Router();

router.post("/prompt", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const newPrompt = new Prompt({
      prompt,
      response: "This is a placeholder response.",
    });

    await newPrompt.save();
    console.log("Prompt saved with ID:", newPrompt._id);
    res.json({ response: newPrompt._id.toString() });
  } catch (error) {
    console.error("Error saving prompt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prompts", async (_req: Request, res: Response): Promise<void> => {
  try {
    const prompts = await Prompt.find().sort({ createdAt: -1 }).limit(10);
    console.log("Retrieved prompts:", prompts.length);
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
