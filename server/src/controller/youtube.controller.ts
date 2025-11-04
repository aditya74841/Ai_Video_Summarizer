import { Request, Response } from "express";
import { Video } from "../model/video.model";
import { YtDlp } from "ytdlp-nodejs";
import path from "path";
import fs from "fs";

const ytdlp = new YtDlp();

export const downloadYouTubeAudio = async (req: Request, res: Response) => {
  try {
    const { youtubeUrl, title } = req.body;

    console.log("🔍 Validating YouTube URL...", youtubeUrl);

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

    console.log("🎬 Fetching video info from YouTube...");

    // Get video info
    const videoInfo = await ytdlp.getInfoAsync(youtubeUrl);

    if (videoInfo._type === "playlist") {
      return res.status(400).json({
        success: false,
        message:
          "Playlists are not supported. Please provide a single video URL",
      });
    }

    console.log("✅ Video info retrieved:", {
      title: videoInfo.title,
      duration: videoInfo.duration,
    });

    const videoTitle = title || videoInfo.title;
    const duration = videoInfo.duration;

    // Create output directory for audio
    const audioDir = path.join(__dirname, "../../uploads/audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Create video document first
    const doc = await Video.create({
      title: videoTitle,
      path: youtubeUrl, // Store YouTube URL instead of file path
      size: 0, // We don't have size yet
      mimetype: "audio/wav",
      duration,
      processingStatus: "audio_extracted",
      youtubeUrl: youtubeUrl,
    });

    const audioOutputPath = path.join(audioDir, `${doc._id}.wav`);

    console.log("🎵 Downloading audio from YouTube...");

    // Download audio only with proper options
    await ytdlp.downloadAsync(youtubeUrl, {
      format: {
        filter: "audioonly",
        quality: 9, // 0-10, where 0 is best quality
        type: "wav",
      },
      output: audioOutputPath,
      onProgress: (progress) => {
        console.log(`Download progress:`, progress);
      },
    });

    console.log("⏳ Verifying audio file...");

    // Verify audio file was created (with a small delay for file system)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!fs.existsSync(audioOutputPath)) {
      throw new Error("Audio file was not created successfully");
    }

    // Get file size
    const stats = fs.statSync(audioOutputPath);
    console.log(
      `✅ Audio file created: ${audioOutputPath} (${stats.size} bytes)`
    );

    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const relativeAudioPath = `uploads/audio/${doc._id}.wav`;
    const audioUrl = `${baseUrl}/${relativeAudioPath}`;

    // Update video document
    doc.audioPath = audioOutputPath;
    doc.size = stats.size;
    doc.audioUrl = audioUrl;
    doc.processingStatus = "audio_extracted";
    await doc.save();

    console.log("✅ Audio downloaded successfully");

    return res.status(201).json({
      success: true,
      message: "Audio downloaded from YouTube successfully",
      video: {
        id: doc._id,
        title: doc.title,
        duration: doc.duration,
        size: doc.size,
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

        // Delete audio file if it exists
        if (video.audioPath && fs.existsSync(video.audioPath)) {
          fs.unlinkSync(video.audioPath);
          console.log("🗑️ Cleaned up partial audio file");
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to download audio from YouTube",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
