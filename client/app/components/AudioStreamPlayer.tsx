"use client";

import React from "react";

interface AudioStreamPlayerProps {
  audioUrl?: string;
  processingStatus: string | null;
}

export default function AudioStreamPlayer({ audioUrl, processingStatus }: AudioStreamPlayerProps) {
  if (!audioUrl || processingStatus !== "audio_extracted") return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
        <span>🎵</span> 16kHz Mono Audio Stream Preview
      </div>
      <audio controls className="w-full" src={audioUrl}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
