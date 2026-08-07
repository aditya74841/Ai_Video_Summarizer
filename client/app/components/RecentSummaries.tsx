"use client";

import { useEffect, useState } from "react";
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
    toast.success("Summary removed from local cache");
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
        Loading recent summaries...
      </div>
    );
  }

  if (summaries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h2 className="text-lg font-bold text-gray-900">Recent Summaries (Offline Cached)</h2>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
          {summaries.length} Saved (7-Day Auto Cleanup)
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {summaries.map((item) => {
          const isExpanded = expandedId === item.videoId;
          const cleanSummary = sanitizeContent(item.summary);

          return (
            <div
              key={item.videoId}
              className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-gray-50/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{item.title}</h3>
                    {item.youtubeUrl ? (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium border border-red-100">
                        YouTube
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                        File Upload
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Saved: {formatDate(item.createdAt)}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectSummary(item)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    View ➔
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item.videoId)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                    title="Delete from cache"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quick Summary Snippet */}
              <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-white p-2.5 rounded border border-gray-100 font-sans">
                {cleanSummary}
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : item.videoId)}
                className="text-[11px] text-indigo-600 font-medium hover:underline flex items-center gap-1"
              >
                {isExpanded ? "Collapse Details ▲" : "Expand Full Summary & Transcript ▼"}
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 bg-white p-3 rounded-lg border">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Full Summary</h4>
                    <div className="text-xs text-gray-700 leading-relaxed font-sans prose prose-xs max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h4 className="font-bold text-xs text-gray-900 mt-2 mb-1">{children}</h4>,
                          h2: ({ children }) => <h4 className="font-bold text-xs text-gray-900 mt-2 mb-1">{children}</h4>,
                          h3: ({ children }) => <h4 className="font-bold text-xs text-indigo-900 mt-2 mb-1 uppercase">{children}</h4>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1 pl-1">{children}</ul>,
                          li: ({ children }) => <li className="text-gray-700">{children}</li>,
                          p: ({ children }) => <p className="text-gray-700 mb-1.5">{children}</p>,
                        }}
                      >
                        {cleanSummary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {item.transcript && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 mb-1">Transcript</h4>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                        {item.transcript}
                      </p>
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
