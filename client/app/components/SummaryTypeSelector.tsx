"use client";

import React from "react";

interface SummaryTypeSelectorProps {
  summaryType: "short" | "detailed";
  onSelectSummaryType: (type: "short" | "detailed") => void;
}

const OPTIONS = [
  {
    key: "short" as const,
    icon: "⚡",
    label: "Short Summary",
    description: "2-3 sentence overview + 3 key takeaways",
  },
  {
    key: "detailed" as const,
    icon: "🔍",
    label: "Detailed Analysis",
    description: "In-depth breakdown with 5-7 technical points",
  },
];

export default function SummaryTypeSelector({
  summaryType,
  onSelectSummaryType,
}: SummaryTypeSelectorProps) {
  return (
    <div
      className="card"
      style={{ padding: "20px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Summary Mode
        </p>
        <span className="badge badge-accent">
          {summaryType === "short" ? "⚡ Short active" : "🔍 Detailed active"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {OPTIONS.map(({ key, icon, label, description }) => {
          const isActive = summaryType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectSummaryType(key)}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isActive ? "var(--accent-dim)" : "var(--bg-elevated)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "var(--shadow-accent)" : "none",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                }
              }}
              id={`summary-type-${key}-btn`}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "0",
                    height: "0",
                    borderStyle: "solid",
                    borderWidth: "0 28px 28px 0",
                    borderColor: `transparent var(--accent) transparent transparent`,
                  }}
                />
              )}
              <div
                style={{
                  fontSize: "20px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                {icon}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: isActive ? "var(--accent-light)" : "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
