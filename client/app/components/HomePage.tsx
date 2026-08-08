"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import ProcessingSteps from "./ ProcessingSteps";
import ContentCard from "./ContentCard";
import RecentSummaries from "./RecentSummaries";
import UploadPanel from "./UploadPanel";
import YouTubeGallery from "./YouTubeGallery";
import MediaHeaderBanner from "./MediaHeaderBanner";
import SummaryTypeSelector from "./SummaryTypeSelector";
import PipelineActions from "./PipelineActions";
import SseProgressBar from "./SseProgressBar";
import YouTubePlayerCard from "./YouTubePlayerCard";
import AudioStreamPlayer from "./AudioStreamPlayer";
import { useVideoPipeline } from "../hooks/useVideoPipeline";

const FEATURES = [
  { icon: "🎙️", label: "Accurate Transcription", desc: "Speech-to-text for any video" },
  { icon: "🧠", label: "Smart Summaries", desc: "Short overviews or deep-dive analysis" },
  { icon: "📡", label: "Real-time Progress", desc: "Live pipeline updates as it processes" },
  { icon: "💾", label: "Offline Cache", desc: "Auto-save with 7-day local retention" },
];

export default function HomePage() {
  const {
    file,
    videoData,
    currentStep,
    uploadProgress,
    loading,
    videoURL,
    isURLMode,
    summaryType,
    refreshCacheTrigger,
    sseMessage,
    sseProgress,
    steps,
    setIsURLMode,
    setVideoURL,
    setSummaryType,
    handleFileChange,
    handleUpload,
    handleUseDemoVideo,
    handleUploadURL,
    handleExtractAudio,
    handleTranscribe,
    handleSaveTranscriptEdit,
    handleSummarize,
    downloadMarkdownSummary,
    resetAll,
    handleSelectCachedSummary,
  } = useVideoPipeline();

  const getYouTubeEmbedId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const youtubeEmbedId = getYouTubeEmbedId(videoData?.youtubeUrl || (isURLMode ? videoURL : ""));

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontFamily: "inherit",
          },
        }}
      />

      {/* ── Fixed ambient background ── */}
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}
      >
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", right: "-5%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)",
        }} />
        {/* Vertical center divider glow — only on desktop */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: "1px", height: "80%",
          background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.15), rgba(139,92,246,0.25), rgba(139,92,246,0.15), transparent)",
          display: "none",  // overridden by CSS media query below
        }} className="desktop-divider-glow" />
      </div>

      {/* ── Desktop Split Layout ── */}
      <div className="split-layout" style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

        {/* ════════════════════════════════════
            LEFT PANEL — Branding & Info
            ════════════════════════════════════ */}
        <aside className="left-panel">
          {/* Sticky inner container */}
          <div className="left-panel-inner">

            {/* Logo — Clickable to reset to Home */}
            <div
              onClick={resetAll}
              title="Go to Home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "48px",
                cursor: "pointer",
                userSelect: "none",
                width: "fit-content",
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.opacity = "1";
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", boxShadow: "0 6px 20px rgba(139,92,246,0.45)",
                flexShrink: 0,
              }}>
                ⚡
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.03em" }}>
                  VideoAI
                </span>
              </div>
            </div>

            {/* Hero headline */}
            <div style={{ marginBottom: "36px" }}>
              <h1 style={{
                fontSize: "clamp(32px, 3.5vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                marginBottom: "18px",
              }}>
                <span className="text-gradient">AI-Powered</span>
                <br />
                <span style={{ color: "var(--text-primary)" }}>Video</span>
                <br />
                <span style={{ color: "var(--text-primary)" }}>Summary</span>
              </h1>
              <p style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                maxWidth: "340px",
              }}>
                Drop any video or paste a YouTube link. We extract audio, transcribe every word, and distill the key insights using AI.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-accent)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--accent-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)";
                  }}
                >
                  <span style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    background: "var(--accent-dim)", border: "1px solid var(--border-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "17px", flexShrink: 0,
                  }}>
                    {f.icon}
                  </span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {f.label}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
              marginBottom: "40px",
            }}>
              {[
                { value: "16kHz", label: "Audio Quality" },
                { value: "< 2min", label: "Avg. Pipeline" },
                { value: "7 days", label: "Cache Lifetime" },
                { value: "100%", label: "Offline Ready" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    textAlign: "center",
                  }}
                >
                  <p style={{
                    fontSize: "20px", fontWeight: 800,
                    letterSpacing: "-0.03em",
                    background: "linear-gradient(135deg, #c4b5fd, #8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "4px",
                  }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer credits */}
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.8 }}>
              Built by{" "}
              <a
                href="https://linkedin.com/in/aditya74841"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-light)", fontWeight: 700, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Aditya Ranjan
              </a>
              {" — Full-Stack Developer"}
              <div style={{ marginTop: "10px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href="https://github.com/aditya74841/Ai_Video_Summarizer"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    color: "var(--text-secondary)", textDecoration: "none",
                    fontSize: "12px", fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-accent)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                  }}
                >
                  ⭐ Star on GitHub
                </a>
                <a
                  href="mailto:aditya@iamadityaranjan.com"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    color: "var(--text-secondary)", textDecoration: "none",
                    fontSize: "12px", fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-accent)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                  }}
                >
                  💼 Hire Me
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════════
            RIGHT PANEL — Interactive Controls
            ════════════════════════════════════ */}
        <section className="right-panel">
          {/* Processing Steps (shown at top when video loaded) */}
          {videoData && (
            <div style={{ marginBottom: "24px" }}>
              <ProcessingSteps currentStep={currentStep} steps={steps} />
            </div>
          )}

          {/* SSE Progress */}
          <SseProgressBar message={sseMessage} progress={sseProgress} loading={loading} />

          {/* ── No video loaded: Input UI ── */}
          {!videoData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Tab + Input Card */}
              <div className="card animate-fade-up" style={{ padding: "28px" }}>
                {/* Mode Switcher */}
                <div style={{
                  display: "flex",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  padding: "4px",
                  border: "1px solid var(--border)",
                  marginBottom: "28px",
                }}>
                  {[
                    { label: "Upload File", icon: "📁", key: false as boolean },
                    { label: "YouTube", icon: "▶️", key: true as boolean },
                  ].map(({ label, icon, key }) => (
                    <button
                      key={String(key)}
                      onClick={() => setIsURLMode(key)}
                      style={{
                        flex: 1, padding: "10px 16px", fontSize: "13px",
                        fontWeight: 600, borderRadius: "9px", border: "none",
                        cursor: "pointer", transition: "all 0.2s ease",
                        background: isURLMode === key ? "var(--bg-card)" : "transparent",
                        color: isURLMode === key ? "var(--text-primary)" : "var(--text-muted)",
                        boxShadow: isURLMode === key ? "var(--shadow-sm)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                      }}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {isURLMode ? (
                  <YouTubeGallery
                    videoURL={videoURL}
                    loading={loading}
                    onURLChange={setVideoURL}
                    onSubmitURL={handleUploadURL}
                  />
                ) : (
                  <UploadPanel
                    file={file}
                    loading={loading}
                    uploadProgress={uploadProgress}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                    onUseDemoVideo={handleUseDemoVideo}
                  />
                )}
              </div>

              <RecentSummaries
                onSelectSummary={handleSelectCachedSummary}
                refreshTrigger={refreshCacheTrigger}
              />
            </div>
          ) : (
            /* ── Video loaded: Results UI ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", animation: "fade-in-up 0.35s ease" }}>
              <MediaHeaderBanner
                title={videoData.title}
                id={videoData._id}
                duration={videoData.duration}
                sampleRate={videoData.sampleRate}
                channels={videoData.channels}
                processingStatus={videoData.processingStatus}
              />

              <YouTubePlayerCard youtubeEmbedId={youtubeEmbedId} />

              <AudioStreamPlayer
                audioUrl={videoData.audioUrl}
                processingStatus={videoData.processingStatus}
              />

              {videoData.transcript && (
                <ContentCard
                  title="Transcript"
                  icon="📝"
                  content={videoData.transcript}
                  gradient={false}
                  allowEdit={
                    videoData.processingStatus === "transcribed" ||
                    videoData.processingStatus === "summarized"
                  }
                  onSaveEdit={handleSaveTranscriptEdit}
                />
              )}

              {(videoData.processingStatus === "transcribed" ||
                videoData.processingStatus === "summarized") && (
                <SummaryTypeSelector
                  summaryType={summaryType}
                  onSelectSummaryType={setSummaryType}
                />
              )}

              {videoData.summary && (
                <div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                        AI Generated Summary
                      </span>
                      <span className="badge badge-accent">
                        {summaryType === "short" ? "⚡ Short" : "🔍 Detailed"}
                      </span>
                    </div>
                    <button onClick={downloadMarkdownSummary} className="btn btn-ghost" style={{ gap: "6px" }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export .md
                    </button>
                  </div>
                  <ContentCard
                    title="Executive Summary"
                    icon="🧠"
                    content={videoData.summary}
                    gradient={false}
                  />
                </div>
              )}

              <PipelineActions
                processingStatus={videoData.processingStatus}
                loading={loading}
                hasSummary={!!videoData.summary}
                summaryType={summaryType}
                onReset={resetAll}
                onExtractAudio={handleExtractAudio}
                onTranscribe={handleTranscribe}
                onSummarize={handleSummarize}
              />

              <RecentSummaries
                onSelectSummary={handleSelectCachedSummary}
                refreshTrigger={refreshCacheTrigger}
              />
            </div>
          )}
        </section>
      </div>

      {/* ── Layout styles injected as a style tag ── */}
      <style>{`
        /* ── Split layout ── */
        .split-layout {
          display: flex;
          min-height: 100vh;
        }

        /* ── Left Panel ── */
        .left-panel {
          display: none; /* hidden on mobile */
        }

        /* ── Right Panel ── */
        .right-panel {
          flex: 1;
          padding: 32px 20px 80px;
          min-width: 0;
        }

        /* ── Desktop breakpoint (≥ 1024px) ── */
        @media (min-width: 1024px) {
          .split-layout {
            display: flex;
            flex-direction: row;
          }

          /* Left: fixed sticky branding panel */
          .left-panel {
            display: flex;
            width: 42%;
            max-width: 520px;
            min-width: 340px;
            flex-shrink: 0;
            border-right: 1px solid var(--border);
            position: relative;
          }

          .left-panel::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(
              to bottom,
              transparent 0%,
              rgba(139, 92, 246, 0.15) 15%,
              rgba(139, 92, 246, 0.3) 40%,
              rgba(139, 92, 246, 0.3) 60%,
              rgba(139, 92, 246, 0.15) 85%,
              transparent 100%
            );
            pointer-events: none;
          }

          .left-panel-inner {
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            padding: 48px 48px 48px 56px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            width: 100%;
            scrollbar-width: none;
          }
          .left-panel-inner::-webkit-scrollbar { display: none; }

          /* Right: scrollable content panel */
          .right-panel {
            flex: 1;
            padding: 48px 48px 80px 52px;
            overflow-y: auto;
            min-width: 0;
          }
        }

        /* ── Large desktop ── */
        @media (min-width: 1440px) {
          .left-panel {
            width: 44%;
          }
          .left-panel-inner {
            padding: 56px 56px 56px 80px;
          }
          .right-panel {
            padding: 56px 80px 80px 56px;
          }
        }
      `}</style>
    </main>
  );
}
