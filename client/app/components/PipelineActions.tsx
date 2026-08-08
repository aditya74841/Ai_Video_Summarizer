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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "flex-end",
        paddingTop: "8px",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Reset */}
      <button
        onClick={onReset}
        className="btn btn-secondary"
        id="reset-btn"
        style={{ padding: "11px 18px" }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Start Over
      </button>

      {/* Extract Audio */}
      {processingStatus === "uploaded" && (
        <button
          onClick={onExtractAudio}
          disabled={loading}
          className="btn btn-primary"
          id="extract-audio-btn"
          style={{ padding: "11px 20px" }}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Extracting…
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Extract Audio
            </>
          )}
        </button>
      )}

      {/* Transcribe */}
      {processingStatus === "audio_extracted" && (
        <button
          onClick={onTranscribe}
          disabled={loading}
          className="btn btn-primary"
          id="transcribe-btn"
          style={{ padding: "11px 20px" }}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Transcribing…
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Transcribe Audio
            </>
          )}
        </button>
      )}

      {/* Summarize */}
      {(processingStatus === "transcribed" || processingStatus === "summarized") && (
        <button
          onClick={onSummarize}
          disabled={loading}
          className="btn btn-primary"
          id="summarize-btn"
          style={{ padding: "11px 20px" }}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Generating…
            </>
          ) : hasSummary ? (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate {summaryType === "short" ? "Short" : "Detailed"}
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate {summaryType === "short" ? "Short" : "Detailed"} Summary
            </>
          )}
        </button>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
