import { Request, Response } from "express";
import fs from "fs";
import { Video } from "../model/video.model";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { sendProgress } from "../utils/progress.util";
import { normalizeTranscript } from "../utils/transcriptNormalizer.util";
import { createAppError } from "../utils/errors.util";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json(createAppError("VIDEO_NOT_FOUND", "Video record not found"));
    }

    if (!video.audioPath || !fs.existsSync(video.audioPath)) {
      return res.status(400).json(
        createAppError(
          "TRANSCRIPT_NOT_AVAILABLE",
          "Audio file not found on server. Extract audio or upload file first."
        )
      );
    }

    sendProgress(id, "transcribing", 30, "Transcribing Audio with Groq Whisper AI...");

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(video.audioPath),
      model: "whisper-large-v3-turbo",
      temperature: 0,
    });

    const normalized = normalizeTranscript(transcription.text);

    // Save normalized transcript to DB
    video.transcript = normalized.text;
    video.processingStatus = "transcribed";
    if (!video.transcriptSource) {
      video.transcriptSource = "media_whisper";
    }

    // Cleanup: Delete audio file from server disk to save space
    if (video.audioPath && fs.existsSync(video.audioPath)) {
      try {
        fs.unlinkSync(video.audioPath);
        console.log(`🗑️ Successfully deleted temporary audio file: ${video.audioPath}`);
      } catch (unlinkErr) {
        console.warn(`⚠️ Failed to delete temporary audio file: ${unlinkErr}`);
      }
    }

    // Cleanup: Delete original video file
    if (video.path && fs.existsSync(video.path)) {
      try {
        fs.unlinkSync(video.path);
        console.log(`🗑️ Successfully deleted temporary video file: ${video.path}`);
      } catch (unlinkErr) {
        console.warn(`⚠️ Failed to delete video file: ${unlinkErr}`);
      }
    }

    video.audioPath = undefined;
    video.audioUrl = undefined;
    await video.save();

    sendProgress(id, "transcribed", 100, "Whisper AI Transcription Completed");

    return res.status(200).json({
      success: true,
      message: "Transcription complete and audio file cleaned up from server",
      transcript: transcription.text,
    });
  } catch (err: any) {
    console.error("Transcription error:", err.message || err);

    if (err.status === 413 || (err.message && err.message.includes("413"))) {
      return res.status(413).json(
        createAppError(
          "TRANSCRIPTION_FAILED",
          "Audio file is too large for the Groq Whisper API (25MB max limit)."
        )
      );
    }

    return res.status(500).json(createAppError("TRANSCRIPTION_FAILED", err.message));
  }
};

export const summarizeTranscript = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json(createAppError("VIDEO_NOT_FOUND", "Video record not found"));
    }

    const { editedTranscript, summaryType = "short" } = req.body || {};
    const mode = summaryType === "detailed" ? "detailed" : "short";

    if (editedTranscript && typeof editedTranscript === "string") {
      video.transcript = editedTranscript;
      video.summary = undefined; // Reset summary to regenerate with edited transcript
    }

    if (video.summaryType !== mode) {
      video.summary = undefined;
      video.summaryType = mode;
    }

    if (!video.transcript) {
      return res.status(400).json(
        createAppError("TRANSCRIPT_NOT_AVAILABLE", "Transcript missing. Run transcription first.")
      );
    }

    if (video.summary) {
      return res.status(200).json({
        success: true,
        summary: video.summary,
        summaryType: video.summaryType,
        processingStatus: video.processingStatus,
      });
    }

    // Normalize transcript and enforce safe context length (~24,000 chars / ~6,000 tokens)
    const normalized = normalizeTranscript(video.transcript);
    const safeTranscript = normalized.text;

    const cleanAiSummary = (text: string): string => {
      if (!text) return "";
      return text
        .replace(
          /^(Here is a summary of the transcript:|Here is the summary:|Here is a summary:|Here's a summary of the transcript:|Sure! Here is the summary:)\s*/i,
          ""
        )
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
        messages: [{ role: "user", content: prompt }],
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
      throw createAppError("SUMMARY_FAILED", "Failed to generate summary from primary and fallback AI models.");
    }

    video.summary = summary;
    video.processingStatus = "summarized";
    await video.save();

    sendProgress(id, "summarized", 100, "Summary Completed Successfully");

    return res.status(200).json({
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
    const errCode = isRateLimit ? "SUMMARY_FAILED" : "SUMMARY_FAILED";
    return res.status(isRateLimit ? 429 : 500).json(createAppError(errCode, err.message));
  }
};

export const updateTranscript = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json(createAppError("TRANSCRIPT_NOT_AVAILABLE", "Transcript content is required"));
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json(createAppError("VIDEO_NOT_FOUND", "Video record not found"));
    }

    const normalized = normalizeTranscript(transcript);

    video.transcript = normalized.text;
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
    return res.status(500).json(createAppError("TRANSCRIPTION_FAILED", err.message));
  }
};
