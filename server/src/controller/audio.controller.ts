import { Request, Response } from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { Video } from "../model/video.model";

const execPromise = util.promisify(exec);

// ✅ Use ffmpeg-static for bundled binary
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

export const extractAudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find video in database
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: "Video not found" 
      });
    }

    // Check if video file exists
    if (!fs.existsSync(video.path)) {
      return res.status(404).json({
        success: false,
        message: "Video file not found on server",
      });
    }

    // Check if audio already extracted
    if (video.audioPath && fs.existsSync(video.audioPath)) {
      // If audio exists, delete the video file if it still exists
      if (fs.existsSync(video.path)) {
        try {
          fs.unlinkSync(video.path);
        } catch (unlinkError) {
          console.warn(`⚠️ Could not delete video file: ${unlinkError}`);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: "Audio already extracted, video file removed",
        audioPath: video.audioPath,
        processingStatus: video.processingStatus,
      });
    }

    const inputPath = video.path;
    const outputDir = path.join(__dirname, "../../uploads/audio");
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const audioOutputPath = path.join(outputDir, `${id}.mp3`);

    // ✅ Use ffprobe-static binary with explicit path
    const probeCmd = `"${ffprobePath}" -i "${inputPath}" -show_streams -select_streams a -loglevel error`;
    
    const { stdout } = await execPromise(probeCmd);

    if (!stdout || stdout.trim().length === 0) {
      video.processingStatus = "failed";
      await video.save();
      
      // Delete video file even if extraction fails
      if (fs.existsSync(video.path)) {
        try {
          fs.unlinkSync(video.path);
        } catch (unlinkError) {
          console.warn(`⚠️ Could not delete video file: ${unlinkError}`);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: "No audio stream found in this video file",
      });
    }

    // ✅ Compress to 16kHz Mono MP3 at 64kbps (reduces audio file size by ~95%, keeping it far below Groq's 25MB limit)
    const command = `"${ffmpegPath}" -y -i "${inputPath}" -vn -ar 16000 -ac 1 -c:a libmp3lame -b:a 64k "${audioOutputPath}"`;
    
    await execPromise(command, { timeout: 60000 });

    // Verify audio file was created successfully
    if (!fs.existsSync(audioOutputPath)) {
      throw new Error("Audio file was not created successfully");
    }

    // Update video document
    video.audioPath = audioOutputPath;
    video.processingStatus = "audio_extracted";
    await video.save();

    // ✅ DELETE VIDEO FILE AFTER SUCCESSFUL AUDIO EXTRACTION
    if (fs.existsSync(video.path)) {
      try {
        fs.unlinkSync(video.path);
      } catch (unlinkError) {
        console.warn(`⚠️ Could not delete video file: ${unlinkError}`);
        // Continue execution even if deletion fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Audio extracted successfully and video file removed from server",
      audioPath: audioOutputPath,
      processingStatus: video.processingStatus,
    });
  } catch (error: any) {
    console.error("❌ Audio extraction error:", error);
    
    // Update status to failed and cleanup
    try {
      const video = await Video.findById(req.params.id);
      if (video) {
        video.processingStatus = "failed";
        await video.save();
        
        // Delete video file even if extraction fails
        if (video.path && fs.existsSync(video.path)) {
          try {
            fs.unlinkSync(video.path);
          } catch (unlinkError) {
            console.warn(`⚠️ Could not delete video file after error: ${unlinkError}`);
          }
        }
      }
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || "Audio extraction failed",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};



