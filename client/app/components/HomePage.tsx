"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import ProcessingSteps from "./ ProcessingSteps";
import ContentCard from "./ContentCard";
import RecentSummaries from "./RecentSummaries";
import UploadPanel from "./UploadPanel";
import YouTubeGallery from "./YouTubeGallery";
import MediaHeaderBanner from "./MediaHeaderBanner";
import SummaryTypeSelector from "./SummaryTypeSelector";
import PipelineActions from "./PipelineActions";
import SseProgressBar from "./SseProgressBar";
import YouTubePlayerCard from "./YouTubePlayerCard";
import AudioStreamPlayer from "./AudioStreamPlayer";
import { useVideoPipeline } from "../hooks/useVideoPipeline";

export default function HomePage() {
  const {
    file,
    videoData,
    currentStep,
    uploadProgress,
    loading,
    videoURL,
    isURLMode,
    summaryType,
    refreshCacheTrigger,
    sseMessage,
    sseProgress,
    steps,
    setIsURLMode,
    setVideoURL,
    setSummaryType,
    handleFileChange,
    handleUpload,
    handleUseDemoVideo,
    handleUploadURL,
    handleExtractAudio,
    handleTranscribe,
    handleSaveTranscriptEdit,
    handleSummarize,
    downloadMarkdownSummary,
    resetAll,
    handleSelectCachedSummary,
  } = useVideoPipeline();

  const getYouTubeEmbedId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const youtubeEmbedId = getYouTubeEmbedId(videoData?.youtubeUrl || (isURLMode ? videoURL : ""));

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-10 px-4">
      <Toaster position="top-center" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            AI Video Summarizer & Intelligence Platform
          </h1>
          <p className="text-gray-600 text-base max-w-xl mx-auto">
            Extract 16kHz mono audio streams, transcribe with Whisper AI, and generate concise summaries.
          </p>

          {videoData && <ProcessingSteps currentStep={currentStep} steps={steps} />}
        </div>

        {/* Real-time SSE Progress Indicator */}
        <SseProgressBar message={sseMessage} progress={sseProgress} loading={loading} />

        {!videoData ? (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
              {/* Mode Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                    !isURLMode ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setIsURLMode(false)}
                >
                  📁 Upload File
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isURLMode ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setIsURLMode(true)}
                >
                  🔗 YouTube Video Gallery
                </button>
              </div>

              {isURLMode ? (
                <YouTubeGallery
                  videoURL={videoURL}
                  loading={loading}
                  onURLChange={setVideoURL}
                  onSubmitURL={handleUploadURL}
                />
              ) : (
                <UploadPanel
                  file={file}
                  loading={loading}
                  uploadProgress={uploadProgress}
                  onFileChange={handleFileChange}
                  onUpload={handleUpload}
                  onUseDemoVideo={handleUseDemoVideo}
                />
              )}
            </div>

            <RecentSummaries onSelectSummary={handleSelectCachedSummary} refreshTrigger={refreshCacheTrigger} />
          </div>
        ) : (
          <div className="space-y-6">
            <MediaHeaderBanner
              title={videoData.title}
              id={videoData._id}
              duration={videoData.duration}
              sampleRate={videoData.sampleRate}
              channels={videoData.channels}
              processingStatus={videoData.processingStatus}
            />

            <YouTubePlayerCard youtubeEmbedId={youtubeEmbedId} />

            <AudioStreamPlayer audioUrl={videoData.audioUrl} processingStatus={videoData.processingStatus} />

            {videoData.transcript && (
              <ContentCard
                title="Transcript"
                icon="📝"
                content={videoData.transcript}
                gradient={false}
                allowEdit={videoData.processingStatus === "transcribed" || videoData.processingStatus === "summarized"}
                onSaveEdit={handleSaveTranscriptEdit}
              />
            )}

            {(videoData.processingStatus === "transcribed" || videoData.processingStatus === "summarized") && (
              <SummaryTypeSelector summaryType={summaryType} onSelectSummaryType={setSummaryType} />
            )}

            {videoData.summary && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    AI Generated Summary
                    <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full capitalize">
                      {summaryType === "short" ? "⚡ Short Mode" : "🔍 Detailed Mode"}
                    </span>
                  </h3>
                  <button
                    onClick={downloadMarkdownSummary}
                    className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs rounded-md border border-indigo-200 transition-colors"
                  >
                    📥 Export Markdown (.md)
                  </button>
                </div>
                <ContentCard title="Executive Summary" icon="🧠" content={videoData.summary} gradient={false} />
              </div>
            )}

            <PipelineActions
              processingStatus={videoData.processingStatus}
              loading={loading}
              hasSummary={!!videoData.summary}
              summaryType={summaryType}
              onReset={resetAll}
              onExtractAudio={handleExtractAudio}
              onTranscribe={handleTranscribe}
              onSummarize={handleSummarize}
            />

            <RecentSummaries onSelectSummary={handleSelectCachedSummary} refreshTrigger={refreshCacheTrigger} />
          </div>
        )}
      </div>
    </main>
  );
}
