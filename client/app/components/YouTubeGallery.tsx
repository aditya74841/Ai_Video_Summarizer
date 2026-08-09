"use client";

import React from "react";
import toast from "react-hot-toast";

export interface SampleVideo {
  id: string;
  title: string;
  category: string;
  url: string;
}

const SAMPLE_YOUTUBE_VIDEOS: SampleVideo[] = [
  {
    id: "ZXiruGOCn9s",
    title: "What is Transformers?",
    category: "AI & ML",
    url: "https://www.youtube.com/watch?v=ZXiruGOCn9s",
  },
  {
    id: "rJ1Qao09CFI",
    title: "What is an AI",
    category: "Technology",
    url: "https://www.youtube.com/watch?v=rJ1Qao09CFI",
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    category: "Tech History",
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    category: "Entertainment",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

interface YouTubeGalleryProps {
  videoURL: string;
  loading: boolean;
  errorDetails?: {
    code: string;
    message: string;
    userActionMessage?: string;
    suggestedAction?: string;
  } | null;
  onURLChange: (url: string) => void;
  onSubmitURL: (url?: string) => void;
  onSwitchToUpload?: () => void;
  onUseDemoVideo?: () => void;
}

export default function YouTubeGallery({
  videoURL,
  loading,
  errorDetails,
  onURLChange,
  onSubmitURL,
  onSwitchToUpload,
  onUseDemoVideo,
}: YouTubeGalleryProps) {
  const getYouTubeEmbedId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const selectedYouTubeEmbedId = getYouTubeEmbedId(videoURL);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Structured Fallback Error Card */}
      {errorDetails && (
        <div
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "fade-in-up 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#f87171", margin: 0 }}>
                YouTube Content Restricted on Cloud Host
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                {errorDetails.userActionMessage || errorDetails.message}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            {onSwitchToUpload && (
              <button
                onClick={onSwitchToUpload}
                className="btn btn-primary"
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                📁 Upload Video / Audio File
              </button>
            )}
            {onUseDemoVideo && (
              <button
                onClick={onUseDemoVideo}
                className="btn btn-secondary"
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                🎬 Try 1-Click Demo Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* URL Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          YouTube URL · Max 12 minutes
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            className="input"
            value={videoURL}
            onChange={(e) => onURLChange(e.target.value)}
            id="youtube-url-input"
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
          />
          <button
            onClick={() => onSubmitURL()}
            disabled={loading || !videoURL}
            className="btn btn-primary"
            id="youtube-submit-btn"
            style={{ flexShrink: 0, padding: "12px 20px" }}
          >
            {loading ? "Processing…" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Embedded Preview */}
      {selectedYouTubeEmbedId && (
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border-accent)",
            boxShadow: "var(--shadow-accent)",
          }}
        >
          <div
            style={{
              background: "rgba(139,92,246,0.08)",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border-accent)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                  animation: "pulse-ring 2s ease-out infinite",
                }}
              />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-light)" }}>
                Live Preview
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {selectedYouTubeEmbedId}
            </span>
          </div>
          <div style={{ aspectRatio: "16/9", width: "100%" }}>
            <iframe
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              src={`https://www.youtube.com/embed/${selectedYouTubeEmbedId}`}
              title="Selected YouTube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Sample Videos Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Sample Videos
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          {SAMPLE_YOUTUBE_VIDEOS.map((sample) => {
            const isSelected = selectedYouTubeEmbedId === sample.id;
            return (
              <div
                key={sample.id}
                onClick={() => {
                  onURLChange(sample.url);
                  toast.success(`Selected: ${sample.title}`);
                }}
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--accent-dim)"
                    : "var(--bg-elevated)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: isSelected ? "var(--shadow-accent)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.3)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)";
                  }
                }}
              >
                <span className="badge badge-accent" style={{ alignSelf: "flex-start" }}>
                  {sample.category}
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isSelected ? "var(--accent-light)" : "var(--text-primary)",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {sample.title}
                </p>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {isSelected ? "✓ Selected" : "Click to select →"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
