import { Request, Response } from "express";
import { Video } from "../model/video.model";
import { YtDlp } from "ytdlp-nodejs";
import { YoutubeTranscript } from "youtube-transcript";
import path from "path";
import fs from "fs";
import { getAudioMetadata } from "../utils/ffmpeg.util";
import { sendProgress } from "../utils/progress.util";

const ytdlp = new YtDlp();

export const downloadYouTubeAudio = async (req: Request, res: Response) => {
  try {
    const { youtubeUrl, title } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: "YouTube URL is required",
      });
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL",
      });
    }

    // --- METHOD 1: Try Instant YouTube Caption / Subtitle Transcript API first ---
    try {
      console.log(`🌐 Attempting direct YouTube Caption extraction for: ${youtubeUrl}`);
      const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeUrl);

      if (transcriptItems && transcriptItems.length > 0) {
        // Reconstruct complete transcript string across full video
        const fullTranscript = transcriptItems
          .map((item) => item.text)
          .join(" ")
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        const lastChunk = transcriptItems[transcriptItems.length - 1];
        const estimatedDuration = lastChunk ? Math.round((lastChunk.offset + lastChunk.duration) / 1000) : 0;

        // Try getting official title via yt-dlp info metadata if possible, fallback gracefully
        let videoTitle = title || "YouTube Video";
        try {
          const videoInfo: any = await ytdlp.getInfoAsync(youtubeUrl, {
            additionalOptions: ["--no-warnings"],
          } as any);
          if (videoInfo && videoInfo.title) {
            videoTitle = videoInfo.title;
          }
        } catch {
          // If title fetch fails, continue with fallback title
        }

        // Save directly to MongoDB with "transcribed" status
        const doc = await Video.create({
          title: videoTitle,
          path: youtubeUrl,
          size: 0,
          mimetype: "audio/mp3",
          duration: estimatedDuration,
          transcript: fullTranscript,
          processingStatus: "transcribed",
          youtubeUrl: youtubeUrl,
        });

        sendProgress(doc._id.toString(), "transcribed", 100, "YouTube Captions Extracted Instantaneously");
        console.log(`✅ Successfully extracted YouTube transcript for video: ${doc._id}`);

        return res.status(201).json({
          success: true,
          message: "YouTube transcript extracted successfully via Captions API",
          video: {
            _id: doc._id,
            id: doc._id,
            title: doc.title,
            duration: doc.duration,
            transcript: doc.transcript,
            processingStatus: doc.processingStatus,
          },
        });
      }
    } catch (captionErr: any) {
      console.warn("⚠️ YouTube caption extraction unavailable or failed:", captionErr.message || captionErr);
      console.log("🔄 Falling back to yt-dlp audio download...");
    }

    // --- FALLBACK METHOD: yt-dlp Audio Download ---
    let videoInfo: any;
    try {
      videoInfo = await ytdlp.getInfoAsync(youtubeUrl, {
        additionalOptions: [
          "--extractor-args",
          "youtube:player_client=android,web",
          "--no-warnings",
        ],
      } as any);
    } catch (infoError: any) {
      console.warn("⚠️ YouTube info extraction failed:", infoError.message || infoError);
      
      const errorStr = (infoError.message || "").toLowerCase();
      if (
        errorStr.includes("sign in to confirm") ||
        errorStr.includes("bot") ||
        errorStr.includes("429") ||
        errorStr.includes("too many requests") ||
        errorStr.includes("blocked")
      ) {
        return res.status(429).json({
          success: false,
          message: "YouTube security automated rate-limited cloud server IP. Please use the 1-Click Demo Video or upload a local MP4 file!",
        });
      }
      
      throw infoError;
    }

    if (videoInfo._type === "playlist") {
      return res.status(400).json({
        success: false,
        message: "Playlists are not supported. Please provide a single video URL",
      });
    }

    const videoTitle = title || videoInfo.title;
    const duration = videoInfo.duration;

    // Validate YouTube video duration (Maximum 12 minutes = 720 seconds)
    if (duration && duration > 720) {
      return res.status(400).json({
        success: false,
        message: `YouTube video duration (${Math.round(duration / 60)} mins) exceeds the maximum allowed limit of 12 minutes.`,
      });
    }

    // Create output directory for audio
    const audioDir = path.join(__dirname, "../../uploads/audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Create video document first
    const doc = await Video.create({
      title: videoTitle,
      path: youtubeUrl,
      size: 0,
      mimetype: "audio/mp3",
      duration,
      processingStatus: "audio_extracted",
      youtubeUrl: youtubeUrl,
    });

    const audioOutputPath = path.join(audioDir, `${doc._id}.mp3`);
    const ffmpegPath = require("ffmpeg-static");

    // Download audio only with proper options & YouTube player client override
    await ytdlp.downloadAsync(youtubeUrl, {
      format: {
        filter: "audioonly",
        quality: 9,
        type: "mp3",
      },
      output: audioOutputPath,
      additionalOptions: [
        "--extractor-args",
        "youtube:player_client=android,web",
        "--no-warnings",
        "--ffmpeg-location",
        ffmpegPath,
        "--extract-audio",
        "--audio-format",
        "mp3",
        "--postprocessor-args",
        "-ar 16000 -ac 1"
      ],
      onProgress: (progress) => {
        if (progress.percentage) {
          sendProgress(
            doc._id.toString(),
            "downloading",
            Math.round(progress.percentage),
            `Downloading YouTube Audio (${Math.round(progress.percentage)}%)`
          );
        }
      },
    });

    // Verify audio file was created (with a small delay for file system)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!fs.existsSync(audioOutputPath)) {
      throw new Error("Audio file was not created successfully");
    }

    const stats = fs.statSync(audioOutputPath);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
    const relativeAudioPath = `uploads/audio/${doc._id}.mp3`;
    const audioUrl = `${baseUrl}/${relativeAudioPath}`;

    const metadata = await getAudioMetadata(audioOutputPath);

    doc.audioPath = audioOutputPath;
    doc.size = stats.size;
    doc.audioUrl = audioUrl;
    doc.sampleRate = metadata.sampleRate || 16000;
    doc.channels = metadata.channels || 1;
    doc.bitrate = metadata.bitrate;
    doc.processingStatus = "audio_extracted";
    await doc.save();

    sendProgress(doc._id.toString(), "audio_extracted", 100, "16kHz Mono Audio Extracted");

    return res.status(201).json({
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
      },
    });
  } catch (error: any) {
    console.error("❌ YouTube download error:", error);

    // Cleanup on error
    try {
      const video = await Video.findOne({
        youtubeUrl: req.body.youtubeUrl,
      }).sort({ createdAt: -1 });
      if (video) {
        video.processingStatus = "failed";
        await video.save();

        if (video.audioPath && fs.existsSync(video.audioPath)) {
          fs.unlinkSync(video.audioPath);
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    const errorStr = (error.message || "").toLowerCase();
    const isRateLimited =
      errorStr.includes("sign in to confirm") ||
      errorStr.includes("bot") ||
      errorStr.includes("429") ||
      errorStr.includes("too many requests") ||
      errorStr.includes("blocked");

    const message = isRateLimited
      ? "YouTube automated rate-limited cloud server IP. Please use the 1-Click Demo Video or upload a local MP4 file!"
      : error.message || "Failed to download audio from YouTube";

    return res.status(isRateLimited ? 429 : 500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
