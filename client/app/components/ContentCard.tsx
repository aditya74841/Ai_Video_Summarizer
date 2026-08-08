"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface ContentCardProps {
  title: string;
  icon: string;
  content: string;
  gradient?: boolean;
  maxHeight?: string;
  isMarkdown?: boolean;
  allowEdit?: boolean;
  onSaveEdit?: (editedContent: string) => Promise<void> | void;
}

const sanitizeContent = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^(Here is a summary of the transcript:|Here is the summary:|Here is a summary:|Here's a summary of the transcript:|Sure! Here is the summary:)\s*/gi, "")
    .trim();
};

export default function ContentCard({
  title,
  icon,
  content,
  maxHeight = "max-h-96",
  isMarkdown = true,
  allowEdit = false,
  onSaveEdit,
}: ContentCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedText(content);
  }, [content]);

  const cleanText = sanitizeContent(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editedText : cleanText);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSave = async () => {
    if (!editedText.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    setSaving(true);
    try {
      if (onSaveEdit) await onSaveEdit(editedText);
      setIsEditing(false);
      toast.success("Saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card"
      style={{ padding: "0", overflow: "hidden" }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
            }}
          >
            {icon}
          </span>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          {allowEdit && !isEditing && (
            <span className="badge badge-accent">Editable</span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {allowEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost"
              style={{ gap: "6px", padding: "6px 12px" }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}

          <button onClick={handleCopy} className="btn btn-ghost" style={{ padding: "6px 12px", gap: "6px" }}>
            {copied ? (
              <>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--success)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: "var(--success)" }}>Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card body */}
      {isEditing ? (
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={10}
            className="input"
            placeholder="Edit transcript text here…"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              resize: "vertical",
              lineHeight: 1.7,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              onClick={() => { setEditedText(content); setIsEditing(false); }}
              disabled={saving}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            maxHeight: maxHeight === "max-h-96" ? "384px" : undefined,
            overflowY: "auto",
          }}
        >
          {isMarkdown ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "16px", marginBottom: "6px" }}>{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", marginTop: "16px", marginBottom: "6px" }}>{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 style={{ fontWeight: 700, fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "20px", marginBottom: "8px" }}>{children}</h4>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600, color: "var(--text-primary)" }}>{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ listStyle: "none", padding: 0, margin: "10px 0", display: "flex", flexDirection: "column", gap: "8px" }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li style={{ display: "flex", gap: "10px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>→</span>
                      <span>{children}</span>
                    </li>
                  ),
                  p: ({ children }) => (
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, fontSize: "14px", marginBottom: "10px" }}>{children}</p>
                  ),
                }}
              >
                {cleanText}
              </ReactMarkdown>
            </div>
          ) : (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-mono)",
              }}
            >
              {cleanText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
