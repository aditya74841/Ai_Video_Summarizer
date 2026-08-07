"use client";

import React from "react";
import toast from "react-hot-toast";

export interface SampleVideo {
  id: string;
  title: string;
  category: string;
  url: string;
}

const SAMPLE_YOUTUBE_VIDEOS: SampleVideo[] = [
  {
    id: "ZXiruGOCn9s",
    title: "What is Transformers ?",
    category: "AI & Machine Learning",
    url: "https://www.youtube.com/watch?v=ZXiruGOCn9s",
  },
  {
    id: "rJ1Qao09CFI",
    title: "What is an AI",
    category: "Web Development",
    url: "https://www.youtube.com/watch?v=rJ1Qao09CFI",
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo (First YouTube Video)",
    category: "Tech History",
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up - Official Video",
    category: "Entertainment Test",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

interface YouTubeGalleryProps {
  videoURL: string;
  loading: boolean;
  onURLChange: (url: string) => void;
  onSubmitURL: (url?: string) => void;
}

export default function YouTubeGallery({
  videoURL,
  loading,
  onURLChange,
  onSubmitURL,
}: YouTubeGalleryProps) {
  const getYouTubeEmbedId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const selectedYouTubeEmbedId = getYouTubeEmbedId(videoURL);

  return (
    <div className="space-y-6">
      {/* YouTube Link Input Bar */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Paste YouTube URL (Max 12 minutes)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={videoURL}
            onChange={(e) => onURLChange(e.target.value)}
          />
          <button
            onClick={() => onSubmitURL()}
            disabled={loading || !videoURL}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Summarize Video"}
          </button>
        </div>
      </div>

      {/* Instant Embedded Player Preview */}
      {selectedYouTubeEmbedId && (
        <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm bg-black space-y-0">
          <div className="bg-indigo-900 text-white text-xs px-4 py-2 font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              Direct YouTube Player Preview
            </span>
            <span className="text-indigo-200">ID: {selectedYouTubeEmbedId}</span>
          </div>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full border-0"
              src={`https://www.youtube.com/embed/${selectedYouTubeEmbedId}`}
              title="Selected YouTube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Featured Genuine Video Picker Grid */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span>🎬</span> Select a Sample YouTube Video (Max 12 Mins)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_YOUTUBE_VIDEOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onURLChange(sample.url);
                toast.success(`Selected: ${sample.title}`);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedYouTubeEmbedId === sample.id
                  ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {sample.category}
                </span>
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{sample.title}</h4>
              </div>

              <div className="mt-4 flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-500">Click to Preview & Load</span>
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  Select ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
