import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Video } from "../model/video.model";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAI) {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    
    if (!googleApiKey) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables");
    }
    
    genAI = new GoogleGenerativeAI(googleApiKey);
    console.log("✅ GoogleGenerativeAI initialized");
  }
  
  return genAI;
};

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    console.log("🎤 Starting transcription process...");
    const { id } = req.params;

    // Find video in database
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // VALIDATION: Check if audio has been extracted
    if (!video.audioPath) {
      return res.status(400).json({
        success: false,
        message: "Audio not extracted. Please extract audio first using /extract-audio/:id endpoint",
        processingStatus: video.processingStatus,
      });
    }

    // Check if already transcribed
    if (video.transcript) {
      // If already transcribed, ensure audio file is deleted
      if (video.audioPath && fs.existsSync(video.audioPath)) {
        fs.unlinkSync(video.audioPath);
        console.log(`✅ Audio file deleted (already transcribed): ${video.audioPath}`);
      }
      
      return res.status(200).json({
        success: true,
        message: "Video already transcribed, audio file removed",
        transcript: video.transcript,
        processingStatus: video.processingStatus,
      });
    }

    // Verify audio file exists
    const audioPath = path.resolve(video.audioPath);
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ 
        success: false, 
        message: "Audio file not found on server" 
      });
    }

    // Check audio file size (should be under 20MB for Base64 approach)
    const stats = fs.statSync(audioPath);
    if (stats.size > 20 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "Audio file too large for transcription (max 20MB)",
      });
    }

    console.log("📖 Reading audio file:", audioPath);
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString("base64");

    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    console.log("🚀 Sending to Gemini for transcription...");
    const result = await model.generateContent([
      {
        text: "Transcribe the following audio into clear and accurate text:",
      },
      {
        inlineData: {
          mimeType: "audio/wav",
          data: base64Audio,
        },
      },
    ]);

    const transcription = result.response.text();
    console.log("✅ Transcription completed");

    // Save transcript to MongoDB
    video.transcript = transcription;
    video.processingStatus = "transcribed";
    await video.save();

    // ✅ DELETE AUDIO FILE AFTER SUCCESSFUL TRANSCRIPTION
    if (video.audioPath && fs.existsSync(video.audioPath)) {
      fs.unlinkSync(video.audioPath);
      console.log(`✅ Audio file deleted after transcription: ${video.audioPath}`);
    }

    res.status(200).json({
      success: true,
      message: "Transcription completed successfully, audio file removed from server",
      transcript: transcription,
      processingStatus: video.processingStatus,
    });
  } catch (err: any) {
    console.error("❌ Transcription error:", err.message || err);
    
    // Update status to failed
    try {
      const video = await Video.findById(req.params.id);
      if (video) {
        video.processingStatus = "failed";
        await video.save();
        
        // ✅ DELETE AUDIO FILE EVEN IF TRANSCRIPTION FAILS
        if (video.audioPath && fs.existsSync(video.audioPath)) {
          fs.unlinkSync(video.audioPath);
          console.log(`🗑️ Audio file deleted after transcription error: ${video.audioPath}`);
        }
      }
    } catch {}

    res.status(500).json({
      success: false,
      message: err.message || "Transcription failed",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export const summarizeTranscript = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find video & check transcript
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: "Video not found" 
      });
    }

    // VALIDATION: Check if video has been transcribed
    if (!video.transcript) {
      return res.status(400).json({
        success: false,
        message: "Transcript not found. Please transcribe audio first using /transcribe/:id endpoint",
        processingStatus: video.processingStatus,
      });
    }

    // Check if already summarized
    if (video.summary) {
      return res.status(200).json({
        success: true,
        message: "Video already summarized",
        summary: video.summary,
        processingStatus: video.processingStatus,
      });
    }

    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const prompt = `
You are an expert video summarizer. Given the transcript below,
create both a **short summary (2-3 sentences)** and a **detailed summary (5 bullet points)**.

Transcript:
${video.transcript}

Format your response as:

Short Summary:
[summary here]

Detailed Summary:
1. ...
2. ...
3. ...
4. ...
5. ...
`;

    console.log("🧠 Sending transcript to Gemini for summarization...");
    const result = await model.generateContent(prompt);

    const summary = result.response?.text?.() || "No summary generated";

    // Save summary in MongoDB
    video.summary = summary;
    video.processingStatus = "summarized";
    await video.save();

    res.status(200).json({
      success: true,
      message: "Summary generated successfully",
      summary,
      processingStatus: video.processingStatus,
    });
  } catch (err: any) {
    console.error("❌ Summarization error:", err.message || err);
    
    // Update status to failed
    try {
      const video = await Video.findById(req.params.id);
      if (video) {
        video.processingStatus = "failed";
        await video.save();
      }
    } catch {}

    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate summary",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export const listAvailableModels = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    models: ["gemini-2.0-flash-exp"],
    message: "Available Gemini models for transcription and summarization",
  });
};





// import { Request, Response } from "express";
// import fs from "fs";
// import path from "path";
// import { Video } from "../model/video.model";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// let genAI: GoogleGenerativeAI | null = null;

// const getGenAI = (): GoogleGenerativeAI => {
//   if (!genAI) {
//     const googleApiKey = process.env.GOOGLE_API_KEY;
    
//     if (!googleApiKey) {
//       throw new Error("GOOGLE_API_KEY is not set in environment variables");
//     }
    
//     genAI = new GoogleGenerativeAI(googleApiKey);
//     console.log("✅ GoogleGenerativeAI initialized");
//   }
  
//   return genAI;
// };

// export const transcribeAudio = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     // Find video in database
//     const video = await Video.findById(id);
    
//     if (!video) {
//       return res.status(404).json({
//         success: false,
//         message: "Video not found",
//       });
//     }

//     // VALIDATION: Check if audio has been extracted
//     if (!video.audioPath) {
//       return res.status(400).json({
//         success: false,
//         message: "Audio not extracted. Please extract audio first using /extract-audio/:id endpoint",
//         processingStatus: video.processingStatus,
//       });
//     }

//     // Check if already transcribed
//     if (video.transcript) {
//       return res.status(200).json({
//         success: true,
//         message: "Video already transcribed",
//         transcript: video.transcript,
//         processingStatus: video.processingStatus,
//       });
//     }

//     // Verify audio file exists
//     const audioPath = path.resolve(video.audioPath);
//     if (!fs.existsSync(audioPath)) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Audio file not found on server" 
//       });
//     }

//     // Check audio file size (should be under 20MB for Base64 approach)
//     const stats = fs.statSync(audioPath);
//     if (stats.size > 20 * 1024 * 1024) {
//       return res.status(413).json({
//         success: false,
//         message: "Audio file too large for transcription (max 20MB)",
//       });
//     }

//     console.log("📖 Reading audio file:", audioPath);
//     const audioBuffer = fs.readFileSync(audioPath);
//     const base64Audio = audioBuffer.toString("base64");

//     const ai = getGenAI();
//     const model = ai.getGenerativeModel({
//       model: "gemini-2.0-flash-exp",
//     });

//     console.log("🚀 Sending to Gemini for transcription...");
//     const result = await model.generateContent([
//       {
//         text: "Transcribe the following audio into clear and accurate text:",
//       },
//       {
//         inlineData: {
//           mimeType: "audio/wav",
//           data: base64Audio,
//         },
//       },
//     ]);

//     const transcription = result.response.text();
//     console.log("✅ Transcription completed");

//     // Save transcript to MongoDB
//     video.transcript = transcription;
//     video.processingStatus = "transcribed";
//     await video.save();

//     res.status(200).json({
//       success: true,
//       message: "Transcription completed successfully",
//       transcript: transcription,
//       processingStatus: video.processingStatus,
//     });
//   } catch (err: any) {
//     console.error("❌ Transcription error:", err.message || err);
    
//     // Update status to failed
//     try {
//       const video = await Video.findById(req.params.id);
//       if (video) {
//         video.processingStatus = "failed";
//         await video.save();
//       }
//     } catch {}

//     res.status(500).json({
//       success: false,
//       message: err.message || "Transcription failed",
//       error: process.env.NODE_ENV === "development" ? err.stack : undefined,
//     });
//   }
// };

// export const summarizeTranscript = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     // Find video & check transcript
//     const video = await Video.findById(id);
//     if (!video) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Video not found" 
//       });
//     }

//     // VALIDATION: Check if video has been transcribed
//     if (!video.transcript) {
//       return res.status(400).json({
//         success: false,
//         message: "Transcript not found. Please transcribe audio first using /transcribe/:id endpoint",
//         processingStatus: video.processingStatus,
//       });
//     }

//     // Check if already summarized
//     if (video.summary) {
//       return res.status(200).json({
//         success: true,
//         message: "Video already summarized",
//         summary: video.summary,
//         processingStatus: video.processingStatus,
//       });
//     }

//     const ai = getGenAI();
//     const model = ai.getGenerativeModel({
//       model: "gemini-2.0-flash-exp",
//     });

//     const prompt = `
// You are an expert video summarizer. Given the transcript below,
// create both a **short summary (2-3 sentences)** and a **detailed summary (5 bullet points)**.

// Transcript:
// ${video.transcript}

// Format your response as:

// Short Summary:
// [summary here]

// Detailed Summary:
// 1. ...
// 2. ...
// 3. ...
// 4. ...
// 5. ...
// `;

//     console.log("🧠 Sending transcript to Gemini for summarization...");
//     const result = await model.generateContent(prompt);

//     const summary = result.response?.text?.() || "No summary generated";

//     // Save summary in MongoDB
//     video.summary = summary;
//     video.processingStatus = "summarized";
//     await video.save();

//     res.status(200).json({
//       success: true,
//       message: "Summary generated successfully",
//       summary,
//       processingStatus: video.processingStatus,
//     });
//   } catch (err: any) {
//     console.error("❌ Summarization error:", err.message || err);
    
//     // Update status to failed
//     try {
//       const video = await Video.findById(req.params.id);
//       if (video) {
//         video.processingStatus = "failed";
//         await video.save();
//       }
//     } catch {}

//     res.status(500).json({
//       success: false,
//       message: err.message || "Failed to generate summary",
//       error: process.env.NODE_ENV === "development" ? err.stack : undefined,
//     });
//   }
// };

// export const listAvailableModels = async (req: Request, res: Response) => {
//   res.status(200).json({
//     success: true,
//     models: ["gemini-2.0-flash-exp"],
//     message: "Available Gemini models for transcription and summarization",
//   });
// };


