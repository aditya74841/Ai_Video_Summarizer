"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSummary, cleanupStaleSummaries, CachedSummary } from "../utils/indexedDB";
import { fetchClientYouTubeData } from "../utils/clientYoutube";

export type ProcessingStep =
  | "upload"
  | "extract"
  | "transcribe"
  | "summarize"
  | "complete";

export interface VideoData {
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

export function useVideoPipeline() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("upload");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [videoURL, setVideoURL] = useState<string>("");
  const [isURLMode, setIsURLMode] = useState<boolean>(false);
  const [summaryType, setSummaryType] = useState<"short" | "detailed">("short");
  const [refreshCacheTrigger, setRefreshCacheTrigger] = useState<number>(0);

  // Server health state for Render Free Tier cold-start monitoring
  const [serverReady, setServerReady] = useState<boolean>(false);
  const [isWakingUpServer, setIsWakingUpServer] = useState<boolean>(false);

  // Real-time SSE State
  const [sseMessage, setSseMessage] = useState<string>("");
  const [sseProgress, setSseProgress] = useState<number>(0);

  const rawServerUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const SERVER_URL = rawServerUrl.replace(/\/api\/videos\/?$/, "").replace(/\/+$/, "");
  const API_URL = `${SERVER_URL}/api/videos`;

  const steps = [
    { id: "upload", label: "Upload", icon: "📤", step: 1 },
    { id: "extract", label: "Extract", icon: "🎵", step: 2 },
    { id: "transcribe", label: "Transcribe", icon: "📝", step: 3 },
    { id: "summarize", label: "Summarize", icon: "🧠", step: 4 },
  ];

  // Ping backend on app startup to wake up Render free tier instances
  useEffect(() => {
    let isMounted = true;
    let wakeToastId: string | null = null;

    const checkServerHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${SERVER_URL}/health-check`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          setServerReady(true);
          setIsWakingUpServer(false);
          return;
        }
      } catch {}

      if (!isMounted) return;

      setIsWakingUpServer(true);
      wakeToastId = toast.loading("⚡ Connecting to server (Render free tier cold start ~30s)...", {
        id: "server-wakeup",
      });

      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${SERVER_URL}/health-check`);
          if (res.ok) {
            clearInterval(pollInterval);
            if (isMounted) {
              setServerReady(true);
              setIsWakingUpServer(false);
              toast.success("🚀 Backend server ready!", { id: "server-wakeup" });
            }
          }
        } catch {}
      }, 3000);
    };

    checkServerHealth();

    return () => {
      isMounted = false;
    };
  }, [SERVER_URL]);

  // Silent 7-day auto-cleanup background task on app startup
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

    // Solution 1: Try client-side (browser) caption extraction on real user IP
    let clientData: { transcript: string; title: string } | null = null;
    try {
      clientData = await fetchClientYouTubeData(urlToProcess);
    } catch {
      // Silent fallback to backend
    }

    try {
      const res = await axios.post(`${API_URL}/youtube/download`, {
        youtubeUrl: urlToProcess,
        clientTranscript: clientData?.transcript,
        title: clientData?.title,
      });
      toast.success("YouTube URL accepted!");
      setVideoData(res.data.video);
      router.push(`?id=${res.data.video._id}`);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "URL processing failed";
      toast.error(errMsg, { duration: 6000 });

      // Suggest 1-Click Demo Video as a quick reliable alternative!
      toast("💡 Tip: Try clicking '1-Click Demo Video' to test the full processing pipeline instantly!", {
        icon: "🎬",
        duration: 8000,
      });
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

  const resetAll = async () => {
    if (videoData?._id) {
      try {
        await axios.delete(`${API_URL}/reset/${videoData._id}`);
      } catch (err) {
        console.warn("⚠️ Server cleanup warning on reset:", err);
      }
    }
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

  return {
    file,
    videoData,
    currentStep,
    uploadProgress,
    loading,
    videoURL,
    isURLMode,
    summaryType,
    refreshCacheTrigger,
    serverReady,
    isWakingUpServer,
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
  };
}
