import { Request, Response } from "express";
import { IngestionService } from "../services/ingestion.service";
import { createAppError } from "../utils/errors.util";

const ingestionService = new IngestionService();

export const downloadYouTubeAudio = async (req: Request, res: Response) => {
  try {
    const { youtubeUrl, title } = req.body;

    if (!youtubeUrl) {
      const err = createAppError("INVALID_YOUTUBE_URL", "YouTube URL is required.");
      return res.status(400).json(err);
    }

    const result = await ingestionService.processYouTubeUrl(youtubeUrl, title);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("❌ YouTube ingestion error in controller:", error);

    if (error && error.code && error.userActionMessage) {
      const statusCode =
        error.code === "YOUTUBE_ACCESS_RESTRICTED"
          ? 429
          : error.code === "INVALID_YOUTUBE_URL"
          ? 400
          : 500;
      return res.status(statusCode).json(error);
    }

    const fallbackError = createAppError(
      "YOUTUBE_ACCESS_RESTRICTED",
      error.message || "Failed to process YouTube URL"
    );
    return res.status(429).json(fallbackError);
  }
};
