"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import ProcessingSteps from "./ ProcessingSteps";
import ContentCard from "./ContentCard";
import RecentSummaries from "./RecentSummaries";
import { saveSummary, cleanupStaleSummaries, CachedSummary } from "../utils/indexedDB";

type ProcessingStep =
  | "upload"
  | "extract"
  | "transcribe"
  | "summarize"
  | "complete";

interface VideoData {
  _id: string;
  title: string;
  size: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  processingStatus: string | null;
  audioUrl?: string;
  transcript?: string;
  summary?: string;
  summaryType?: "short" | "detailed";
  youtubeUrl?: string;
}

const SAMPLE_YOUTUBE_VIDEOS = [
  {
    id: "aircAruvnKk",
    title: "But what is a Neural Network? | Deep Learning",
    category: "AI & Machine Learning",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
  },
  {
    id: "bMknfKXIFA8",
    title: "React in 100 Seconds",
    category: "Web Development",
    url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
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

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("upload");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [videoURL, setVideoURL] = useState<string>("");
  const [isURLMode, setIsURLMode] = useState<boolean>(false);
  const [summaryType, setSummaryType] = useState<"short" | "detailed">("short"); // Preselected to short by default
  const [refreshCacheTrigger, setRefreshCacheTrigger] = useState<number>(0);

  // Real-time SSE State
  const [sseMessage, setSseMessage] = useState<string>("");
  const [sseProgress, setSseProgress] = useState<number>(0);

  const API_URL = "http://localhost:8080/api/videos";

  const steps = [
    { id: "upload", label: "Upload", icon: "📤", step: 1 },
    { id: "extract", label: "Extract", icon: "🎵", step: 2 },
    { id: "transcribe", label: "Transcribe", icon: "📝", step: 3 },
    { id: "summarize", label: "Summarize", icon: "🧠", step: 4 },
  ];

  // Run silent 7-day auto-cleanup background task on app startup
  useEffect(() => {
    cleanupStaleSummaries(7).then((purgedCount) => {
      if (purgedCount > 0) {
        setRefreshCacheTrigger(Date.now());
      }
    });
  }, []);

  useEffect(() => {
    const videoId = searchParams.get("id");
    if (videoId) {
      fetchVideoData(videoId);
    }
  }, [searchParams]);

  // Connect to SSE stream for live progress updates
  useEffect(() => {
    if (!videoData?._id) return;

    const eventSource = new EventSource(`${API_URL}/progress/${videoData._id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) setSseMessage(data.message);
        if (typeof data.percentage === "number") setSseProgress(data.percentage);

        if (data.stage === "audio_extracted" || data.stage === "transcribed" || data.stage === "summarized") {
          fetchVideoData(videoData._id);
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [videoData?._id]);

  const fetchVideoData = async (videoId: string) => {
    try {
      const res = await axios.get(`${API_URL}/get-video/${videoId}`);
      const video = res.data.video;
      setVideoData(video);
      if (video.summaryType) {
        setSummaryType(video.summaryType);
      }

      if (video.processingStatus === "uploaded") {
        setCurrentStep("extract");
      } else if (video.processingStatus === "audio_extracted") {
        setCurrentStep("transcribe");
      } else if (video.processingStatus === "transcribed") {
        setCurrentStep("summarize");
      } else if (video.processingStatus === "summarized") {
        setCurrentStep("complete");

        // Automatically cache summarized video in IndexedDB
        if (video.summary) {
          await saveSummary({
            videoId: video._id,
            title: video.title,
            transcript: video.transcript,
            summary: video.summary,
            createdAt: Date.now(),
            youtubeUrl: video.youtubeUrl,
            duration: video.duration,
          });
          setRefreshCacheTrigger(Date.now());
        }
      }
    } catch (err: any) {
      toast.error("Failed to fetch video data");
    }
  };

  const handleSelectCachedSummary = (cached: CachedSummary) => {
    setVideoData({
      _id: cached.videoId,
      title: cached.title,
      size: 0,
      duration: cached.duration,
      processingStatus: "summarized",
      transcript: cached.transcript,
      summary: cached.summary,
      youtubeUrl: cached.youtubeUrl,
    });
    setCurrentStep("complete");
    toast.success("Loaded summary from local offline cache!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Enforce 20MB maximum file limit check
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds the 20MB maximum limit");
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (overrideFile?: File) => {
    const targetFile = overrideFile || file;
    if (!targetFile) {
      toast.error("Please select a video file");
      return;
    }

    if (targetFile.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds the 20MB maximum limit");
      return;
    }

    const formData = new FormData();
    formData.append("video", targetFile);
    formData.append("title", targetFile.name);

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });
      setVideoData(res.data.video);
      toast.success("Video uploaded successfully!");
      setCurrentStep("extract");
      setUploadProgress(0);
      router.push(`?id=${res.data.video._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoVideo = async () => {
    try {
      setLoading(true);
      toast.loading("Loading demo video sample (demo_video.mp4)...", { id: "demo-load" });
      const res = await fetch("/demo_video.mp4");
      if (!res.ok) throw new Error("Failed to fetch demo video from public folder");
      const blob = await res.blob();
      const demoFile = new File([blob], "demo_video.mp4", { type: "video/mp4" });
      setFile(demoFile);
      toast.success("Loaded demo_video.mp4! Starting upload...", { id: "demo-load" });
      await handleUpload(demoFile);
    } catch (err: any) {
      toast.error(err.message || "Failed to load demo video", { id: "demo-load" });
      setLoading(false);
    }
  };

  const handleUploadURL = async (targetUrl?: string) => {
    const urlToProcess = targetUrl || videoURL;
    if (!urlToProcess) {
      toast.error("Please select or enter a YouTube video URL");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/youtube/download`, {
        youtubeUrl: urlToProcess,
      });
      toast.success("YouTube URL accepted!");
      setVideoData(res.data.video);
      router.push(`?id=${res.data.video._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "URL processing failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoData) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/extract-audio/${videoData._id}`);
      toast.success("Audio extracted successfully!");
      await fetchVideoData(videoData._id);
      setCurrentStep("transcribe");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Audio extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!videoData) return;
    setLoading(true);
    try {
      await axios.get(`${API_URL}/transcribe/${videoData._id}`);
      toast.success("Transcription completed!");
      await fetchVideoData(videoData._id);
      setCurrentStep("summarize");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTranscriptEdit = async (editedTranscript: string) => {
    if (!videoData) return;
    try {
      const res = await axios.put(`${API_URL}/update-transcript/${videoData._id}`, {
        transcript: editedTranscript,
      });
      setVideoData(res.data.video);
      toast.success("Transcript updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update transcript");
    }
  };

  const handleSummarize = async () => {
    if (!videoData) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/summarize/${videoData._id}`, {
        editedTranscript: videoData.transcript,
        summaryType,
      });
      toast.success(`${summaryType === "short" ? "Short" : "Detailed"} summary generated!`);
      await fetchVideoData(videoData._id);
      setCurrentStep("complete");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdownSummary = () => {
    if (!videoData?.summary) return;
    const blob = new Blob([`# Summary: ${videoData.title}\n\n${videoData.summary}`], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded Summary (.md)");
  };

  const resetAll = () => {
    setFile(null);
    setVideoData(null);
    setCurrentStep("upload");
    setUploadProgress(0);
    setLoading(false);
    setVideoURL("");
    setSseMessage("");
    setSseProgress(0);
    setSummaryType("short");
    router.push("/");
  };

  // Extract YouTube ID for Video Embed
  const getYouTubeEmbedId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const selectedYouTubeEmbedId = getYouTubeEmbedId(videoURL);
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
        {sseMessage && loading && (
          <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm space-y-2">
            <div className="flex justify-between text-sm font-medium text-indigo-900">
              <span>{sseMessage}</span>
              <span>{sseProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${sseProgress}%` }}
              ></div>
            </div>
          </div>
        )}

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
                        onChange={(e) => setVideoURL(e.target.value)}
                      />
                      <button
                        onClick={() => handleUploadURL()}
                        disabled={loading || !videoURL}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Summarize Video"}
                      </button>
                    </div>
                  </div>

                  {/* Instant Embedded Player for selected / typed YouTube URL */}
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

                  {/* Featured Video Picker Grid */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <span>🎬</span> Select a Sample YouTube Video (Max 12 Mins)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {SAMPLE_YOUTUBE_VIDEOS.map((sample) => (
                        <div
                          key={sample.id}
                          onClick={() => {
                            setVideoURL(sample.url);
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
              ) : (
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
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

                  {/* 1-Click Demo Video Test Action */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      onClick={() => handleUpload()}
                      disabled={loading || !file}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {loading ? `Uploading (${uploadProgress}%)...` : "Upload Chosen Video File"}
                    </button>

                    <button
                      type="button"
                      onClick={handleUseDemoVideo}
                      disabled={loading}
                      className="py-3 px-5 bg-gradient-to-r bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
                    >
                      <span>🎬</span>
                      <span>Test with Demo Video (`demo_video.mp4`)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Offline IndexedDB Recent Summaries Section */}
            <RecentSummaries
              onSelectSummary={handleSelectCachedSummary}
              refreshTrigger={refreshCacheTrigger}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Media Stats Banner */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{videoData.title}</h2>
                <p className="text-xs text-gray-500 mt-1">ID: {videoData._id}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {videoData.duration && (
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md">
                    ⏱️ {Math.round(videoData.duration)}s
                  </span>
                )}
                {videoData.sampleRate && (
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md border border-indigo-100">
                    🎵 {videoData.sampleRate}Hz ({videoData.channels === 1 ? "Mono" : "Stereo"})
                  </span>
                )}
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-100 capitalize">
                  Status: {videoData.processingStatus}
                </span>
              </div>
            </div>

            {/* Embedded YouTube Video Player */}
            {youtubeEmbedId && (
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
            )}

            {/* Audio Preview Player */}
            {videoData.audioUrl && videoData.processingStatus === "audio_extracted" && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <span>🎵</span> 16kHz Mono Audio Stream Preview
                </div>
                <audio controls className="w-full" src={videoData.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Transcript Card with Editing Mode */}
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

            {/* Summary Type Selector Control */}
            {(videoData.processingStatus === "transcribed" || videoData.processingStatus === "summarized") && (
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
                    onClick={() => setSummaryType("short")}
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
                    onClick={() => setSummaryType("detailed")}
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
            )}

            {/* AI Summary Card */}
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

            {/* Pipeline Action Controls */}
            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <button
                onClick={resetAll}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors"
              >
                Reset / Start Over
              </button>

              {videoData.processingStatus === "uploaded" && (
                <button
                  onClick={handleExtractAudio}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Extracting..." : "Extract 16kHz Audio"}
                </button>
              )}

              {videoData.processingStatus === "audio_extracted" && (
                <button
                  onClick={handleTranscribe}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? "Transcribing..." : "Transcribe Audio"}
                </button>
              )}

              {(videoData.processingStatus === "transcribed" || videoData.processingStatus === "summarized") && (
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {loading ? (
                    "Generating AI Summary..."
                  ) : videoData.summary ? (
                    `Regenerate as ${summaryType === "short" ? "Short" : "Detailed"} Summary 🔄`
                  ) : (
                    `Generate ${summaryType === "short" ? "Short" : "Detailed"} AI Summary`
                  )}
                </button>
              )}
            </div>

            {/* Offline Recent Summaries Section when viewing a video */}
            <RecentSummaries
              onSelectSummary={handleSelectCachedSummary}
              refreshTrigger={refreshCacheTrigger}
            />
          </div>
        )}
      </div>
    </main>
  );
}
