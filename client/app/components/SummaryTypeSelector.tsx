"use client";

import React from "react";

interface SummaryTypeSelectorProps {
  summaryType: "short" | "detailed";
  onSelectSummaryType: (type: "short" | "detailed") => void;
}

export default function SummaryTypeSelector({
  summaryType,
  onSelectSummaryType,
}: SummaryTypeSelectorProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <span>⚙️</span> Select Summary Length Mode
        </span>
        <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">
          Preselected: Short Summary
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelectSummaryType("short")}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            summaryType === "short"
              ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-bold"
              : "border-gray-200 bg-white text-gray-700 hover:border-indigo-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold flex items-center gap-1">⚡ Short Summary</span>
            {summaryType === "short" && <span className="text-indigo-600 font-bold">✓ Active</span>}
          </div>
          <p className="text-[11px] font-normal text-gray-500">
            2-3 sentence core overview + 3 concise key takeaways (Preselected)
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectSummaryType("detailed")}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            summaryType === "detailed"
              ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-bold"
              : "border-gray-200 bg-white text-gray-700 hover:border-indigo-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold flex items-center gap-1">🔍 Detailed Summary</span>
            {summaryType === "detailed" && <span className="text-indigo-600 font-bold">✓ Active</span>}
          </div>
          <p className="text-[11px] font-normal text-gray-500">
            In-depth executive analysis + 5-7 key technical breakdown points
          </p>
        </button>
      </div>
    </div>
  );
}
