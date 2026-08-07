"use client";

import React from "react";

interface PipelineActionsProps {
  processingStatus: string | null;
  loading: boolean;
  hasSummary: boolean;
  summaryType: "short" | "detailed";
  onReset: () => void;
  onExtractAudio: () => void;
  onTranscribe: () => void;
  onSummarize: () => void;
}

export default function PipelineActions({
  processingStatus,
  loading,
  hasSummary,
  summaryType,
  onReset,
  onExtractAudio,
  onTranscribe,
  onSummarize,
}: PipelineActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-end pt-4">
      <button
        onClick={onReset}
        className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
      >
        Reset / Start Over
      </button>

      {processingStatus === "uploaded" && (
        <button
          onClick={onExtractAudio}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Extracting..." : "Extract 16kHz Audio"}
        </button>
      )}

      {processingStatus === "audio_extracted" && (
        <button
          onClick={onTranscribe}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? "Transcribing..." : "Transcribe Audio"}
        </button>
      )}

      {(processingStatus === "transcribed" || processingStatus === "summarized") && (
        <button
          onClick={onSummarize}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
        >
          {loading ? (
            "Generating AI Summary..."
          ) : hasSummary ? (
            `Regenerate as ${summaryType === "short" ? "Short" : "Detailed"} Summary 🔄`
          ) : (
            `Generate ${summaryType === "short" ? "Short" : "Detailed"} AI Summary`
          )}
        </button>
      )}
    </div>
  );
}
