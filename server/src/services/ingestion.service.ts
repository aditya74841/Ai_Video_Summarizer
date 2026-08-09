import { YouTubeTranscriptProvider } from "./providers/youtubeTranscript.provider";
import { YouTubeMediaProvider } from "./providers/youtubeMedia.provider";
import { Video } from "../model/video.model";
import { createAppError } from "../utils/errors.util";
import { sendProgress } from "../utils/progress.util";

export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
};

export class IngestionService {
  private transcriptProvider = new YouTubeTranscriptProvider();
  private mediaProvider = new YouTubeMediaProvider();

  public async processYouTubeUrl(youtubeUrl: string, requestedTitle?: string) {
    if (!youtubeUrl) {
      throw createAppError("INVALID_YOUTUBE_URL", "YouTube URL is required.");
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      throw createAppError("INVALID_YOUTUBE_URL", "Invalid YouTube URL format.");
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw createAppError("INVALID_YOUTUBE_URL", "Could not extract video ID from YouTube URL.");
    }

    // Step 1: Create initial Video document in MongoDB
    const doc = await Video.create({
      title: requestedTitle || "YouTube Video",
      path: youtubeUrl,
      size: 0,
      mimetype: "audio/mp3",
      duration: 0,
      processingStatus: "validating",
      youtubeUrl,
    });

    const jobId = doc._id.toString();

    // --- STEP 2: Try Fast-Path Caption Provider ---
    try {
      sendProgress(jobId, "fetching_transcript", 20, "Attempting Direct Caption Extraction...");
      const captionResult = await this.transcriptProvider.getTranscript({
        youtubeUrl,
        videoId,
        jobId,
        title: requestedTitle,
      });

      if (captionResult && captionResult.transcript) {
        doc.title = captionResult.title;
        doc.duration = captionResult.duration || 0;
        doc.transcript = captionResult.transcript;
        doc.processingStatus = "transcribed";
        doc.transcriptSource = "youtube_captions";
        await doc.save();

        sendProgress(jobId, "transcribed", 100, "YouTube Captions Extracted Instantaneously");
        console.log(`✅ [IngestionService] Captions fast-path succeeded for video: ${jobId}`);

        return {
          success: true,
          message: "YouTube transcript extracted successfully via Captions API",
          video: {
            _id: doc._id,
            id: doc._id,
            title: doc.title,
            duration: doc.duration,
            transcript: doc.transcript,
            processingStatus: doc.processingStatus,
            youtubeUrl: doc.youtubeUrl,
          },
        };
      }
    } catch (captionErr) {
      console.warn("⚠️ [IngestionService] Caption provider bypassed, moving to media fallback...", captionErr);
    }

    // --- STEP 3: Fallback Media Provider (yt-dlp) ---
    try {
      sendProgress(jobId, "downloading_media", 40, "Captions unavailable. Attempting audio stream download...");
      const mediaResult = await this.mediaProvider.getTranscript({
        youtubeUrl,
        videoId,
        jobId,
        title: requestedTitle,
      });

      if (mediaResult && mediaResult.audioPath) {
        doc.title = mediaResult.title;
        doc.duration = mediaResult.duration || 0;
        doc.audioPath = mediaResult.audioPath;
        doc.audioUrl = mediaResult.audioUrl;
        doc.size = mediaResult.size || 0;
        doc.sampleRate = mediaResult.metadata?.sampleRate || 16000;
        doc.channels = mediaResult.metadata?.channels || 1;
        doc.bitrate = mediaResult.metadata?.bitrate;
        doc.processingStatus = "audio_extracted";
        doc.transcriptSource = "media_whisper";
        await doc.save();

        sendProgress(jobId, "audio_extracted", 100, "16kHz Mono Audio Stream Downloaded");
        console.log(`✅ [IngestionService] Media fallback succeeded for video: ${jobId}`);

        return {
          success: true,
          message: "Audio downloaded from YouTube successfully",
          video: {
            _id: doc._id,
            id: doc._id,
            title: doc.title,
            duration: doc.duration,
            size: doc.size,
            audioUrl: doc.audioUrl,
            processingStatus: doc.processingStatus,
            youtubeUrl: doc.youtubeUrl,
          },
        };
      }
    } catch (mediaErr: any) {
      console.error("❌ [IngestionService] Media fallback error:", mediaErr.message || mediaErr);

      doc.processingStatus = "failed";
      doc.errorCode = "YOUTUBE_ACCESS_RESTRICTED";
      doc.errorMessage = mediaErr.message || "Failed to download media stream from YouTube";
      await doc.save();

      const errorStr = (mediaErr.message || "").toLowerCase();
      const isRateLimited =
        errorStr.includes("sign in to confirm") ||
        errorStr.includes("bot") ||
        errorStr.includes("429") ||
        errorStr.includes("too many requests") ||
        errorStr.includes("blocked");

      const errCode = isRateLimited ? "YOUTUBE_ACCESS_RESTRICTED" : "MEDIA_DOWNLOAD_FAILED";
      throw createAppError(errCode, mediaErr.message);
    }

    // Default error if both fail without throwing
    doc.processingStatus = "failed";
    await doc.save();
    throw createAppError("TRANSCRIPT_NOT_AVAILABLE");
  }
}
