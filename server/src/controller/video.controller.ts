import { Request, Response } from "express";
import { Video } from "../model/video.model";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video file uploaded",
      });
    }

    const title = (req.body?.title as string) || req.file.originalname;

    // Get video duration using ffprobe
    let duration: number | undefined;
    try {
      const { stdout } = await execPromise(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${req.file.path}"`
      );
      duration = parseFloat(stdout.trim());
    } catch (error) {
      console.warn("Could not get video duration:", error);
    }

    const doc = await Video.create({
      title,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      duration,
      processingStatus: "uploaded",
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded and validated successfully",
      video: {
        _id: doc._id,
        title: doc.title,
        size: doc.size,
        duration: doc.duration,
        processingStatus: doc.processingStatus,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload video",
      error: error.message,
    });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID is required" });
    }

    const video = await Video.findById(id).select("-__v -path");

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    return res.status(200).json({ success: true, video });
  } catch (error) {
    console.error("Get video error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to retrieve video" });
  }
};

// import { Request, Response } from "express";
// import { Video } from "../model/video.model";

// export const uploadVideo = async (req: Request, res: Response) => {
//   if (!req.file) {
//     return res
//       .status(400)
//       .json({ success: false, message: "No video file uploaded" });
//   }

//   const title = (req.body?.title as string) || req.file.originalname;

//   const doc = await Video.create({
//     title,
//     path: req.file.path,
//     size: req.file.size,
//     mimetype: req.file.mimetype,
//   });

//   return res.status(201).json({
//     success: true,
//     message: "Video uploaded and saved",
//     video: doc,
//   });
// };
