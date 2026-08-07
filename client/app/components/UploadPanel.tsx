"use client";

import React from "react";

interface UploadPanelProps {
  file: File | null;
  loading: boolean;
  uploadProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onUseDemoVideo: () => void;
}

export default function UploadPanel({
  file,
  loading,
  uploadProgress,
  onFileChange,
  onUpload,
  onUseDemoVideo,
}: UploadPanelProps) {
  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="video/*"
        onChange={onFileChange}
        className="hidden"
        id="video-file-input"
      />
      <label
        htmlFor="video-file-input"
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 block text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors"
      >
        {file ? (
          <div className="space-y-1">
            <p className="font-semibold text-indigo-600 text-sm">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium text-sm">Click to choose a video file</p>
            <p className="text-xs text-gray-500">Supported formats: MP4, MOV, AVI (Max 20MB Limit)</p>
          </div>
        )}
      </label>

      {/* Upload and 1-Click Demo Video Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={() => onUpload()}
          disabled={loading || !file}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? `Uploading (${uploadProgress}%)...` : "Upload Chosen Video File"}
        </button>

        <button
          type="button"
          onClick={onUseDemoVideo}
          disabled={loading}
          className="py-3 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
        >
          <span>🎬</span>
          <span>Test with Demo Video (`demo_video.mp4`)</span>
        </button>
      </div>
    </div>
  );
}
