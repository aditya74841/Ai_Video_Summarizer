"use client";

import { useState, useEffect } from "react";
import { CachedSummary, getAllSummaries, deleteSummary } from "../utils/indexedDB";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface RecentSummariesProps {
  onSelectSummary: (summary: CachedSummary) => void;
  refreshTrigger?: number;
}

const sanitizeContent = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^(Here is a summary of the transcript:|Here is the summary:|Here is a summary:|Here's a summary of the transcript:|Sure! Here is the summary:)\s*/gi, "")
    .trim();
};

export default function RecentSummaries({ onSelectSummary, refreshTrigger }: RecentSummariesProps) {
  const [summaries, setSummaries] = useState<CachedSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSummaries = async () => {
    setLoading(true);
    const data = await getAllSummaries();
    setSummaries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSummaries();
  }, [refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    await deleteSummary(videoId);
    toast.success("Removed from cache");
    await loadSummaries();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        Loading cached summaries…
      </div>
    );
  }

  if (summaries.length === 0) return null;

  return (
    <div className="card" style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            📚
          </div>
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Recent Summaries
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Offline cached · Auto-clean after 7 days
            </p>
          </div>
        </div>
        <span className="badge badge-neutral">{summaries.length} saved</span>
      </div>

      {/* Items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxHeight: "420px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {summaries.map((item) => {
          const isExpanded = expandedId === item.videoId;
          const cleanSummary = sanitizeContent(item.summary);

          return (
            <div
              key={item.videoId}
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")
              }
            >
              {/* Item header */}
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "3px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "260px",
                        }}
                      >
                        {item.title}
                      </h3>
                      <span
                        className={item.youtubeUrl ? "badge badge-danger" : "badge badge-neutral"}
                      >
                        {item.youtubeUrl ? "YouTube" : "File"}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={() => onSelectSummary(item)}
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                    >
                      View →
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.videoId)}
                      className="btn btn-ghost"
                      title="Delete from cache"
                      style={{ padding: "6px", color: "var(--danger)" }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Summary snippet */}
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.6,
                  }}
                >
                  {cleanSummary}
                </p>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.videoId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--accent-light)",
                    padding: 0,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {isExpanded ? "Collapse ▲" : "Show full summary ▼"}
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    padding: "16px",
                    background: "var(--bg-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "10px",
                      }}
                    >
                      Full Summary
                    </p>
                    <div className="dark-prose" style={{ fontSize: "13px" }}>
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginTop: "12px", marginBottom: "4px" }}>{children}</h4>
                          ),
                          h2: ({ children }) => (
                            <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginTop: "12px", marginBottom: "4px" }}>{children}</h4>
                          ),
                          h3: ({ children }) => (
                            <h4 style={{ fontWeight: 700, fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "12px", marginBottom: "4px" }}>{children}</h4>
                          ),
                          strong: ({ children }) => (
                            <strong style={{ fontWeight: 600, color: "var(--text-primary)" }}>{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0", display: "flex", flexDirection: "column", gap: "6px" }}>{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li style={{ display: "flex", gap: "8px", color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
                              <span>{children}</span>
                            </li>
                          ),
                          p: ({ children }) => (
                            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "8px" }}>{children}</p>
                          ),
                        }}
                      >
                        {cleanSummary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {item.transcript && (
                    <div>
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: "8px",
                        }}
                      >
                        Transcript
                      </p>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.7,
                          maxHeight: "140px",
                          overflowY: "auto",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {item.transcript}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
