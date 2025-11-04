"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import ProcessingSteps from "./components/ ProcessingSteps";
import ContentCard from "./components/ContentCard";

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
  processingStatus: string | null;
  audioUrl?: string;
  transcript?: string;
  summary?: string;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("upload");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videoURL, setVideoURL] = useState<string>("");
  const [isURLMode, setIsURLMode] = useState<boolean>(false);

  const API_URL = "http://localhost:8080/api/videos";
  // const API_URL = "https://ai-video-summarizer-ie74.onrender.com/api/videos";

  const steps = [
    { id: "upload", label: "Upload", icon: "📤", step: 1 },
    { id: "extract", label: "Extract", icon: "🎵", step: 2 },
    { id: "transcribe", label: "Transcribe", icon: "📝", step: 3 },
    { id: "summarize", label: "Summarize", icon: "🧠", step: 4 },
  ];

  // FIXED: Removed 'loading' from dependencies to prevent infinite loops
  useEffect(() => {
    const videoId = searchParams.get("id");
    if (videoId) {
      fetchVideoData(videoId);
    }
  }, [searchParams]); // Only depend on searchParams

  const fetchVideoData = async (videoId: string) => {
    try {
      const res = await axios.get(`${API_URL}/get-video/${videoId}`);
      const video = res.data.video;
      setVideoData(video);
      
      // Update current step based on processing status
      if (video.processingStatus === "uploaded") {
        setCurrentStep("extract");
      } else if (video.processingStatus === "audio_extracted") {
        setCurrentStep("transcribe");
      } else if (video.processingStatus === "transcribed") {
        setCurrentStep("summarize");
      } else if (video.processingStatus === "summarized") {
        setCurrentStep("complete");
      }
    } catch (err: any) {
      toast.error("Failed to fetch video data");
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds 20MB limit");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a video file");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", file.name);

    setLoading(true);
    setError("");

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

  const handleUploadURL = async () => {
    if (!videoURL) {
      toast.error("Please enter a video URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/youtube/download`, {
        youtubeUrl: videoURL,
      });
      toast.success("URL uploaded successfully!");
      router.push(`?id=${res.data.video._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoData) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/extract-audio/${videoData._id}`);
      toast.success("Audio extracted successfully!");
      
      // FIXED: Refetch video data to get updated audioUrl
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
      const res = await axios.get(`${API_URL}/transcribe/${videoData._id}`);
      toast.success("Transcription completed!");
      
      // FIXED: Refetch video data to get updated transcript
      await fetchVideoData(videoData._id);
      setCurrentStep("summarize");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!videoData) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/summarize/${videoData._id}`);
      toast.success("Summary generated!");
      
      // FIXED: Refetch video data to get updated summary
      await fetchVideoData(videoData._id);
      setCurrentStep("complete");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setVideoData(null);
    setCurrentStep("upload");
    setUploadProgress(0);
    setLoading(false);
    setError("");
    setVideoURL("");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-purple-400 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-blue-400 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-br from-indigo-400 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#363636",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-block">
            <h1 className="text-5xl md:text-7xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
              AI Video Summarizer
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
            Transform your videos into concise summaries with AI-powered
            transcription
          </p>

          {/* Progress Steps */}
          {videoData && (
            <ProcessingSteps currentStep={currentStep} steps={steps} />
          )}
        </div>

        {!videoData ? (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-500/10 border border-white/20 p-2 inline-flex mx-auto w-full max-w-md">
              <button
                className={`flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${
                  !isURLMode
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsURLMode(false)}
              >
                <span className="text-xl mr-2">📁</span>
                Upload File
              </button>
              <button
                className={`flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${
                  isURLMode
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsURLMode(true)}
              >
                <span className="text-xl mr-2">🔗</span>
                Paste Link
              </button>
            </div>

            {/* Upload Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/20 p-8 md:p-12 transition-all duration-500 hover:shadow-indigo-500/20">
              {isURLMode ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="text-5xl mb-4">🎬</div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      Paste Video URL
                    </h2>
                    <p className="text-gray-600">
                      Enter a YouTube video link to get started
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 text-lg transition-all duration-300 placeholder:text-gray-400"
                      value={videoURL}
                      onChange={(e) => setVideoURL(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="text-5xl mb-4">📤</div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      Upload Video File
                    </h2>
                    <p className="text-gray-600">Maximum file size: 20MB</p>
                  </div>

                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="upload-video"
                  />

                  <label
                    htmlFor="upload-video"
                    className="group block w-full cursor-pointer"
                  >
                    <div className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 group-hover:scale-[1.02]">
                      {file ? (
                        <div className="space-y-4">
                          <div className="text-6xl">✅</div>
                          <p className="text-xl font-semibold text-gray-800">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-indigo-600 font-medium">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-6xl">📹</div>
                          <p className="text-xl font-semibold text-gray-800">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-sm text-gray-500">
                            MP4, AVI, MOV, or other video formats
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-8">
                {isURLMode ? (
                  <button
                    onClick={handleUploadURL}
                    disabled={loading || !videoURL}
                    className="w-full px-8 py-5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="animate-spin h-6 w-6"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      "Submit URL"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className="w-full px-8 py-5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="animate-spin h-6 w-6"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Uploading... {uploadProgress}%
                      </div>
                    ) : (
                      "Upload Video"
                    )}
                  </button>
                )}

                {/* Upload Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Audio Player */}
            {videoData?.audioUrl &&
              videoData?.processingStatus === "audio_extracted" && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">🎵</span>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Audio Preview
                    </h3>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    src={videoData.audioUrl}
                    crossOrigin="anonymous"
                    preload="metadata"
                    onError={() => toast.error("Failed to load audio")}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

            {/* Transcript */}
            {videoData?.transcript &&
              videoData?.processingStatus === "transcribed" && (
                <ContentCard
                  title="Transcript"
                  icon="📝"
                  content={videoData.transcript}
                  gradient={false}
                />
              )}

            {/* Summary + Transcript */}
            {videoData?.summary &&
              videoData?.processingStatus === "summarized" && (
                <div className="space-y-6">
                  <ContentCard
                    title="AI Summary"
                    icon="✨"
                    content={videoData.summary}
                    gradient={true}
                  />
                  <ContentCard
                    title="Full Transcript"
                    icon="📄"
                    content={videoData.transcript || ""}
                    gradient={false}
                  />
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={resetAll}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Start Over
              </button>

              {videoData.processingStatus === "uploaded" && (
                <button
                  onClick={handleExtractAudio}
                  disabled={loading}
                  className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                >
                  {loading ? "Extracting..." : "Extract Audio"}
                </button>
              )}

              {videoData.processingStatus === "audio_extracted" && (
                <button
                  onClick={handleTranscribe}
                  disabled={loading}
                  className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                >
                  {loading ? "Transcribing..." : "Transcribe Audio"}
                </button>
              )}

              {videoData.processingStatus === "transcribed" && (
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                >
                  {loading ? "Summarizing..." : "Create Summary"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thumb-indigo-500::-webkit-scrollbar-thumb {
          background-color: rgb(99 102 241);
          border-radius: 3px;
        }
        .scrollbar-track-gray-200::-webkit-scrollbar-track {
          background-color: rgb(229 231 235);
        }
      `}</style>
    </main>
  );
}
