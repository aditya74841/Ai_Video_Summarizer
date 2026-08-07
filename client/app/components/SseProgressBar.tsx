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
    <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm space-y-2">
      <div className="flex justify-between text-sm font-medium text-indigo-900">
        <span>{message}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
