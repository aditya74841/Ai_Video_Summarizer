"use client";

import React from "react";

interface SseProgressBarProps {
  message: string;
  progress: number;
  loading: boolean;
}

export default function SseProgressBar({ message, progress, loading }: SseProgressBarProps) {
  if (!message || !loading) return null;

  return (
    <div
      className="card animate-fade-up"
      style={{
        padding: "16px 20px",
        marginBottom: "16px",
        border: "1px solid var(--border-accent)",
        background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Animated dot */}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              animation: "pulse-ring 1.5s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
            {message}
          </span>
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--accent-light)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          width: "100%",
          height: "4px",
          borderRadius: "99px",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-progress-glow"
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd)",
            borderRadius: "99px",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
