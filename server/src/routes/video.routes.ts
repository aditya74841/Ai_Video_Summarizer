// import express from "express";
// import { uploadVideo } from "../controller/video.controller";
// import { upload } from "../middleware/upload.middleware";
// import { extractAudio } from "../controller/audio.controller";
// import { transcribeAudio, listAvailableModels, summarizeTranscript } from "../controller/transcribe.controller";

// const router = express.Router();

// router.post("/upload", upload.single("video"), uploadVideo);
// router.post("/extract-audio/:id", extractAudio);
// router.post("/transcribe/:id", transcribeAudio);
// router.get("/models", listAvailableModels); // List available models
// router.post("/summarize/:id", summarizeTranscript);


// export default router;


import express from "express";
import { uploadVideo } from "../controller/video.controller";
import { upload, validateFileType } from "../middleware/upload.middleware";
import { extractAudio } from "../controller/audio.controller";
import { 
  transcribeAudio, 
//   listAvailableModels, 
  summarizeTranscript 
} from "../controller/transcribe.controller";
import { downloadYouTubeAudio } from "../controller/youtube.controller";

const router = express.Router();

// Upload route with file type validation
router.post("/upload", upload.single("video"), validateFileType, uploadVideo);

// Extract audio (checks if video exists)
router.post("/extract-audio/:id", extractAudio);

// Transcribe (checks if audio exists)
router.post("/transcribe/:id", transcribeAudio);

// Summarize (checks if transcript exists)
router.post("/summarize/:id", summarizeTranscript);

// List available models
// router.get("/models", listAvailableModels);

router.post("/youtube/download", downloadYouTubeAudio);

export default router;
