"use client";

import React from "react";

interface MediaHeaderBannerProps {
  title: string;
  id: string;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  processingStatus: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  uploaded: { label: "Uploaded", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  audio_extracted: { label: "Audio Extracted", color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  transcribed: { label: "Transcribed", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)" },
  summarized: { label: "Summarized", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
};

export default function MediaHeaderBanner({
  title,
  id,
  duration,
  sampleRate,
  channels,
  processingStatus,
}: MediaHeaderBannerProps) {
  const status = processingStatus
    ? (STATUS_MAP[processingStatus] ?? {
        label: processingStatus,
        color: "var(--text-secondary)",
        bg: "rgba(255,255,255,0.04)",
        border: "var(--border)",
      })
    : null;

  return (
    <div
      className="card"
      style={{
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-card)",
      }}
    >
      {/* Title Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              marginBottom: "4px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ID: {id}
          </p>
        </div>

        {status && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 600,
              color: status.color,
              background: status.bg,
              border: `1px solid ${status.border}`,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: status.color,
                display: "inline-block",
              }}
            />
            {status.label}
          </span>
        )}
      </div>

      {/* Meta chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {duration && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            {Math.round(duration)}s
          </div>
        )}
        {sampleRate && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
            </svg>
            {sampleRate}Hz · {channels === 1 ? "Mono" : "Stereo"}
          </div>
        )}
      </div>
    </div>
  );
}
