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

export default function MediaHeaderBanner({
  title,
  id,
  duration,
  sampleRate,
  channels,
  processingStatus,
}: MediaHeaderBannerProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">ID: {id}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {duration && (
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md">
            ⏱️ {Math.round(duration)}s
          </span>
        )}
        {sampleRate && (
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md border border-indigo-100">
            🎵 {sampleRate}Hz ({channels === 1 ? "Mono" : "Stereo"})
          </span>
        )}
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-100 capitalize">
          Status: {processingStatus}
        </span>
      </div>
    </div>
  );
}
