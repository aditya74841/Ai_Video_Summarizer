"use client";

import React, { useRef, useState } from "react";

interface AudioStreamPlayerProps {
  audioUrl?: string;
  processingStatus: string | null;
}

export default function AudioStreamPlayer({
  audioUrl,
  processingStatus,
}: AudioStreamPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!audioUrl || processingStatus !== "audio_extracted") return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const val = parseFloat(e.target.value);
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  return (
    <div
      className="card"
      style={{ padding: "0", overflow: "hidden" }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "rgba(139,92,246,0.06)",
        }}
      >
        <div
          style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "var(--accent-dim)",
            border: "1px solid var(--border-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "15px",
          }}
        >
          🎵
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
            Extracted Audio Preview
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Listen before transcribing
          </p>
        </div>
      </div>

      {/* Player Body */}
      <div style={{ padding: "20px 24px" }}>
        {/* Hidden native audio */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Play / Pause button */}
          <button
            onClick={togglePlay}
            style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(139,92,246,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(139,92,246,0.4)";
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress track */}
          <div style={{ flex: 1 }}>
            <div style={{ position: "relative", marginBottom: "6px" }}>
              {/* Track background */}
              <div
                style={{
                  width: "100%", height: "6px", borderRadius: "99px",
                  background: "rgba(255,255,255,0.06)", overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Progress fill */}
                <div
                  style={{
                    position: "absolute", left: 0, top: 0,
                    height: "100%", width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    borderRadius: "99px",
                    transition: "width 0.1s ease",
                  }}
                />
              </div>
              {/* Invisible seek overlay */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  position: "absolute", top: "-4px", left: 0,
                  width: "100%", height: "14px",
                  opacity: 0, cursor: "pointer", margin: 0,
                }}
              />
            </div>

            {/* Time */}
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "11px", color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
