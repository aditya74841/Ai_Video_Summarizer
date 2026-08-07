"use client";

import React from "react";

interface YouTubePlayerCardProps {
  youtubeEmbedId: string | null;
}

export default function YouTubePlayerCard({ youtubeEmbedId }: YouTubePlayerCardProps) {
  if (!youtubeEmbedId) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 font-semibold text-sm text-gray-800 flex items-center gap-2">
        <span>📺</span> YouTube Video Player
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeEmbedId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
