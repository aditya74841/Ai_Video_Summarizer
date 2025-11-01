

// import mongoose from "mongoose";

// const videoSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     path: { type: String, required: true },
//     size: { type: Number, required: true },
//     mimetype: { type: String, required: true },
//     duration: { type: Number }, // Duration in seconds
//     audioPath: { type: String },
//     transcript: { type: String },
//     summary: { type: String },
//     processingStatus: {
//       type: String,
//       enum: ["uploaded", "audio_extracted", "transcribed", "summarized", "failed"],
//       default: "uploaded",
//     },
//   },
//   { timestamps: true }
// );

// export const Video = mongoose.model("Video", videoSchema);


import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    duration: { type: Number }, // Duration in seconds
    audioPath: { type: String },
    transcript: { type: String },
    summary: { type: String },
    youtubeUrl: { type: String }, // Add this field for YouTube URLs
    processingStatus: {
      type: String,
      enum: [
        "uploaded",
        "downloading",     // Add this for YouTube downloads
        "audio_extracted",
        "transcribed",
        "summarized",
        "failed"
      ],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);
