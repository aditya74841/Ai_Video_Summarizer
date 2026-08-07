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
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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
      if (onSaveEdit) {
        await onSaveEdit(editedText);
      }
      setIsEditing(false);
      toast.success("Changes saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {allowEdit && !isEditing && (
            <span className="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded border border-indigo-100">
              Editable
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 border border-indigo-200"
            >
              <span>✏️ Edit Transcript</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={10}
            className="w-full p-4 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-sans leading-relaxed text-gray-900 bg-white"
            placeholder="Edit transcript text here..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditedText(content);
                setIsEditing(false);
              }}
              disabled={saving}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Transcript Edits"}
            </button>
          </div>
        </div>
      ) : (
        <div className={`bg-gray-50 border border-gray-100 rounded-lg p-5 ${maxHeight} overflow-y-auto`}>
          {isMarkdown ? (
            <div className="prose prose-sm max-w-none text-gray-800 text-sm leading-relaxed space-y-3 font-sans">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h3 className="font-bold text-base text-gray-900 mt-2 mb-1">{children}</h3>,
                  h2: ({ children }) => <h3 className="font-bold text-base text-gray-900 mt-2 mb-1">{children}</h3>,
                  h3: ({ children }) => <h4 className="font-bold text-sm text-indigo-900 mt-3 mb-1 uppercase tracking-wide">{children}</h4>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-2 pl-1">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                  p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-2">{children}</p>,
                }}
              >
                {cleanText}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">{cleanText}</p>
          )}
        </div>
      )}
    </div>
  );
}
