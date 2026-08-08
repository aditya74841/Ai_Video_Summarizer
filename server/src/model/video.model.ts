import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    duration: { type: Number }, // Duration in seconds
    sampleRate: { type: Number }, // e.g. 16000 Hz
    channels: { type: Number }, // e.g. 1 for mono
    bitrate: { type: Number }, // in bps
    audioPath: { type: String },
    audioUrl: { type: String },
    transcript: { type: String },
    summary: { type: String },
    summaryType: { type: String, enum: ["short", "detailed"], default: "short" },
    youtubeUrl: { type: String },
    processingStatus: {
      type: String,
      enum: ["uploaded", "audio_extracted", "transcribed", "summarized", "failed"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);
