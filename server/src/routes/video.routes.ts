

import express from "express";
import { getVideoById, uploadVideo } from "../controller/video.controller";
import { upload, validateFileType } from "../middleware/upload.middleware";
import { extractAudio } from "../controller/audio.controller";
import {
  transcribeAudio,
  //   listAvailableModels,
  summarizeTranscript,
  updateTranscript,
} from "../controller/transcribe.controller";
import { downloadYouTubeAudio } from "../controller/youtube.controller";
import { transcribeRateLimiter, summarizeRateLimiter } from "../middleware/rateLimiter.middleware";
import { getProgressStream } from "../controller/progress.controller";

const router = express.Router();

// SSE real-time progress stream
router.get("/progress/:id", getProgressStream);

// Upload route with file type validation
router.post("/upload", upload.single("video"), validateFileType, uploadVideo);

// Extract audio (checks if video exists)
router.post("/extract-audio/:id", extractAudio);

// Transcribe (checks if audio exists) - Rate limited to 1 request per minute
router.get("/transcribe/:id", transcribeRateLimiter, transcribeAudio);

// Update transcript manually before summarizing
router.put("/update-transcript/:id", updateTranscript);

// Summarize (checks if transcript exists) - Rate limited to 1 request per minute
router.post("/summarize/:id", summarizeRateLimiter, summarizeTranscript);

// List available models
// router.get("/models", listAvailableModels);

router.post("/youtube/download", downloadYouTubeAudio);

router.get("/get-video/:id", getVideoById);

export default router;
