import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Video } from "../model/video.model";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Add this import 👇
import { GoogleAIFileManager } from "@google/generative-ai/server";
import Groq from "groq-sdk";
import { sendProgress } from "../utils/progress.util";

let genAI: GoogleGenerativeAI | null = null;
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // Check if audio exists locally
    if (!video.audioPath || !fs.existsSync(video.audioPath)) {
      return res.status(400).json({
        success: false,
        message: "Audio file not found. Run extract-audio first.",
      });
    }

    sendProgress(id, "transcribing", 30, "Transcribing Audio with Whisper AI...");

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(video.audioPath),
      model: "whisper-large-v3-turbo",
      temperature: 0,
    });

    // Save to DB
    video.transcript = transcription.text;
    video.processingStatus = "transcribed";
    await video.save();

    sendProgress(id, "transcribed", 100, "Transcription Completed");

    // Cleanup: Delete local audio file
    if (fs.existsSync(video.audioPath)) {
      fs.unlinkSync(video.audioPath);
    }

    res.status(200).json({
      success: true,
      message: "Transcription complete",
      transcript: transcription,
    });
  } catch (err: any) {
    console.error("Transcription error:", err.message || err);
    
    // Catch Groq 413 Request Entity Too Large error
    if (err.status === 413 || (err.message && err.message.includes("413")) || (err.message && err.message.includes("request_too_large"))) {
      return res.status(413).json({
        success: false,
        message: "Audio file is too large for the Groq Whisper API (25MB max limit). Please choose a shorter video or smaller file size.",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message || "Transcription failed",
    });
  }
};

export const summarizeTranscript = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // Extract requested summary type ("short" or "detailed", default to "short")
    const { editedTranscript, summaryType = "short" } = req.body || {};
    const mode = summaryType === "detailed" ? "detailed" : "short";

    if (editedTranscript && typeof editedTranscript === "string") {
      video.transcript = editedTranscript;
      video.summary = undefined; // Force regenerate summary with edited transcript
    }

    // If summaryType changed or user requested regeneration, reset summary
    if (video.summaryType !== mode) {
      video.summary = undefined;
      video.summaryType = mode;
    }

    if (!video.transcript) {
      return res.status(400).json({
        success: false,
        message: "Transcript missing. Run /transcribe/:id first",
      });
    }

    if (video.summary) {
      return res.status(200).json({
        success: true,
        summary: video.summary,
        summaryType: video.summaryType,
        processingStatus: video.processingStatus,
      });
    }

    // Truncate transcript if excessively long (safeguard against TPM limits)
    const maxChars = 24000; // ~6000 tokens max input
    const safeTranscript = video.transcript.length > maxChars 
      ? video.transcript.slice(0, maxChars) + "\n...[Transcript truncated due to length]" 
      : video.transcript;

    const cleanAiSummary = (text: string): string => {
      if (!text) return "";
      return text
        .replace(/^(Here is a summary of the transcript:|Here is the summary:|Here is a summary:|Here's a summary of the transcript:|Sure! Here is the summary:)\s*/i, "")
        .trim();
    };

    const shortPrompt = `
You are an expert AI Video Intelligence Assistant. Provide a CONCISE SHORT SUMMARY of the following transcript in crisp Markdown format.

STRICT RULES:
1. Do NOT include any conversational preamble or greeting (e.g. "Here is a summary...", "Sure!").
2. Start directly with the section header: ### ⚡ Short Overview (2-3 crisp sentences maximum).
3. Followed by section header: ### 🎯 Core Takeaways (3 concise bullet points).

Transcript:
${safeTranscript}
`;

    const detailedPrompt = `
You are an expert AI Video Intelligence Assistant. Provide an IN-DEPTH DETAILED SUMMARY of the following transcript in rich Markdown format.

STRICT RULES:
1. Do NOT include any conversational preamble or greeting (e.g. "Here is a summary...", "Sure!").
2. Start directly with section header: ### 📋 Executive Summary.
3. Followed by section header: ### 🔍 In-Depth Analysis (5-7 comprehensive, detailed bullet points explaining main themes, evidence, and key technical concepts).
4. End with section header: ### 💡 Key Actionable Takeaways.

Transcript:
${safeTranscript}
`;

    const prompt = mode === "detailed" ? detailedPrompt : shortPrompt;

    sendProgress(id, "summarizing", 40, "Generating AI Summary with LLM...");

    let summary: string | null = null;

    try {
      // Primary LLM Provider: Groq (llama-3.3-70b-versatile)
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_completion_tokens: 2048,
        top_p: 1,
        stream: false,
      });

      summary = chatCompletion.choices[0]?.message?.content || null;
    } catch (primaryError: any) {
      console.warn("⚠️ Groq LLM primary attempt failed:", primaryError.message || primaryError);

      if (process.env.GOOGLE_API_KEY) {
        const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        summary = response.text();
      } else {
        throw primaryError;
      }
    }

    if (summary) {
      summary = cleanAiSummary(summary);
    }

    if (!summary) {
      throw new Error("Failed to generate summary from both primary and fallback AI models.");
    }

    video.summary = summary;
    video.processingStatus = "summarized";
    await video.save();

    sendProgress(id, "summarized", 100, "Summary Completed Successfully");

    res.status(200).json({
      success: true,
      summary,
      processingStatus: video.processingStatus,
    });
  } catch (err: any) {
    console.error("Summarization error:", err.message || err);

    try {
      const video = await Video.findById(req.params.id);
      if (video) {
        video.processingStatus = "failed";
        await video.save();
      }
    } catch {}

    const isRateLimit = err.status === 429 || err.code === "rate_limit_exceeded" || err.message?.includes("rate_limit");
    const statusCode = isRateLimit ? 429 : 500;
    const clientMessage = isRateLimit 
      ? "AI provider rate limit reached. Please wait a moment before requesting another summary."
      : err.message || "Summarization failed";

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  }
};

/**
 * Endpoint to explicitly save user transcript edits before summarizing
 */
export const updateTranscript = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        success: false,
        message: "Transcript content is required",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    video.transcript = transcript;
    video.summary = undefined; // Reset summary so new transcript can be summarized
    if (video.processingStatus === "summarized") {
      video.processingStatus = "transcribed";
    }
    await video.save();

    return res.status(200).json({
      success: true,
      message: "Transcript updated successfully",
      video,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update transcript",
    });
  }
};
