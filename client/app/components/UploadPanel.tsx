"use client";

import React from "react";

interface UploadPanelProps {
  file: File | null;
  loading: boolean;
  uploadProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onUseDemoVideo: () => void;
}

export default function UploadPanel({
  file,
  loading,
  uploadProgress,
  onFileChange,
  onUpload,
  onUseDemoVideo,
}: UploadPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input
        type="file"
        accept="video/*"
        onChange={onFileChange}
        className="hidden"
        id="video-file-input"
      />

      {/* Drop Zone */}
      <label
        htmlFor="video-file-input"
        style={{
          display: "block",
          border: file
            ? "2px solid var(--accent)"
            : "2px dashed rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-lg)",
          padding: "48px 32px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: file ? "var(--accent-dim)" : "var(--bg-elevated)",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          if (!file) {
            (e.currentTarget as HTMLLabelElement).style.borderColor = "rgba(139,92,246,0.4)";
            (e.currentTarget as HTMLLabelElement).style.background = "rgba(139,92,246,0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!file) {
            (e.currentTarget as HTMLLabelElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLLabelElement).style.background = "var(--bg-elevated)";
          }
        }}
      >
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "4px",
              }}
            >
              🎬
            </div>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--accent-light)" }}>
              {file.name}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "4px",
              }}
            >
              📁
            </div>
            <p style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-secondary)" }}>
              Click to choose a video file
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              MP4, MOV, AVI · Max 20MB
            </p>
          </div>
        )}

        {/* Progress overlay */}
        {loading && uploadProgress > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "3px",
              width: `${uploadProgress}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
              transition: "width 0.3s ease",
              borderRadius: "0 0 0 var(--radius-lg)",
            }}
          />
        )}
      </label>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => onUpload()}
          disabled={loading || !file}
          className="btn btn-primary"
          style={{ flex: 1, padding: "12px" }}
          id="upload-video-btn"
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" />
              </svg>
              Uploading {uploadProgress > 0 ? `${uploadProgress}%` : "…"}
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload & Process
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onUseDemoVideo}
          disabled={loading}
          className="btn btn-secondary"
          id="demo-video-btn"
          style={{ padding: "12px 18px", flexShrink: 0 }}
        >
          🎬 Try Demo
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
