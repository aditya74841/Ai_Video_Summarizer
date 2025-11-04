"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ContentCardProps {
  title: string;
  icon: string;
  content: string;
  gradient?: boolean;
  maxHeight?: string;
}

export default function ContentCard({
  title,
  icon,
  content,
  gradient = false,
  maxHeight = "max-h-96",
}: ContentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      className={`${
        gradient
          ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white"
          : "bg-white/80 backdrop-blur-xl"
      } rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/20 p-8 transition-all duration-500 hover:shadow-indigo-500/20`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          <h3
            className={`text-2xl md:text-3xl font-bold ${
              gradient ? "text-white" : "text-gray-800"
            }`}
          >
            {title}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className={`${
            gradient
              ? "bg-white/20 hover:bg-white/30"
              : "bg-gray-100 hover:bg-gray-200"
          } px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2`}
        >
          {copied ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="hidden md:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden md:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      <div
        className={`${
          gradient
            ? "bg-white/10 backdrop-blur-xl"
            : "bg-linear-to-br from-gray-50 to-gray-100"
        } rounded-2xl p-6 ${maxHeight} overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-200`}
      >
        <p
          className={`${
            gradient ? "text-white" : "text-gray-700"
          } text-base md:text-lg leading-relaxed whitespace-pre-wrap`}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
