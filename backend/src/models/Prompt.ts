import mongoose, { Document, Schema } from "mongoose";

export interface IPrompt extends Document {
  prompt: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema: Schema = new Schema(
  {
    prompt: {
      type: String,
      required: [true, "Prompt text is required"],
      trim: true,
      maxlength: [5000, "Prompt cannot be more than 5000 characters"],
    },
    response: {
      type: String,
      required: [true, "Response is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create an index on the prompt field for faster searching
PromptSchema.index({ prompt: "text" });

export default mongoose.model<IPrompt>("Prompt", PromptSchema);
