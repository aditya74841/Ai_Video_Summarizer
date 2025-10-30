"use client";

import { useState } from "react";
import axios from "axios";

type ProcessingStep = "upload" | "extract" | "transcribe" | "summarize" | "complete";

interface VideoData {
  id: string;
  title: string;
  size: number;
  duration?: number;
  processingStatus: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("upload");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const API_URL = "http://localhost:8080/api/videos";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (20MB limit)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("File size exceeds 20MB limit");
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file");
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
      setMessage("✅ Video uploaded successfully");
      setCurrentStep("extract");
      setUploadProgress(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoData) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/extract-audio/${videoData.id}`);
      setMessage("✅ Audio extracted successfully");
      setCurrentStep("transcribe");
    } catch (err: any) {
      setError(err.response?.data?.message || "Audio extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!videoData) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/transcribe/${videoData.id}`);
      setTranscript(res.data.transcript);
      setMessage("✅ Transcription completed");
      setCurrentStep("summarize");
    } catch (err: any) {
      setError(err.response?.data?.message || "Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!videoData) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/summarize/${videoData.id}`);
      setSummary(res.data.summary);
      setMessage("✅ Summary generated");
      setCurrentStep("complete");
    } catch (err: any) {
      setError(err.response?.data?.message || "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setVideoData(null);
    setCurrentStep("upload");
    setUploadProgress(0);
    setMessage("");
    setTranscript("");
    setSummary("");
    setLoading(false);
    setError("");
  };

  const steps = [
    { id: "upload", label: "Upload", icon: "📤" },
    { id: "extract", label: "Extract Audio", icon: "🎵" },
    { id: "transcribe", label: "Transcribe", icon: "📝" },
    { id: "summarize", label: "Summarize", icon: "🧠" },
    { id: "complete", label: "Complete", icon: "✅" },
  ];

  const getStepIndex = (step: ProcessingStep) => 
    steps.findIndex((s) => s.id === step);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎥 AI Video Summarizer
          </h1>
          <p className="text-lg text-gray-600">
            Upload your video and get AI-powered transcription & summary
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${(getStepIndex(currentStep) / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {steps.map((step, index) => {
              const isActive = getStepIndex(currentStep) >= index;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-col items-center relative">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-indigo-200" : ""}`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive ? "text-indigo-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {message && !error && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <span>{message}</span>
            </div>
          )}

          {/* Step Content */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-4xl">
                    📹
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      Click to upload video
                    </p>
                    <p className="text-sm text-gray-500">
                      MP4, AVI, MOV, MKV, WEBM (Max 20MB)
                    </p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                      🎬
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>📤 Upload Video</>
                )}
              </button>
            </div>
          )}

          {currentStep === "extract" && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-5xl mx-auto">
                🎵
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Extract Audio
                </h2>
                <p className="text-gray-600">
                  Extract audio track from your video for transcription
                </p>
              </div>
              <button
                onClick={handleExtractAudio}
                disabled={loading}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>🎵 Extract Audio</>
                )}
              </button>
            </div>
          )}

          {currentStep === "transcribe" && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mx-auto">
                📝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Transcribe Audio
                </h2>
                <p className="text-gray-600">
                  Convert speech to text using AI transcription
                </p>
              </div>
              <button
                onClick={handleTranscribe}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>📝 Start Transcription</>
                )}
              </button>
            </div>
          )}

          {currentStep === "summarize" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  🧠
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Generate Summary
                </h2>
                <p className="text-gray-600">
                  Create a concise summary of your transcription
                </p>
              </div>

              {transcript && (
                <div className="bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    📄 Transcript Preview
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {transcript.substring(0, 500)}
                    {transcript.length > 500 && "..."}
                  </p>
                </div>
              )}

              <button
                onClick={handleSummarize}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>🧠 Generate Summary</>
                )}
              </button>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg">
                  ✅
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Complete!
                </h2>
                <p className="text-gray-600">
                  Your video has been summarized successfully
                </p>
              </div>

              {/* Transcript Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  📝 Full Transcript
                </h3>
                <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {transcript}
                  </p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  🎯 AI Summary
                </h3>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {summary}
                  </p>
                </div>
              </div>

              <button
                onClick={resetAll}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                🔄 Process Another Video
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Gemini AI • Max file size: 20MB</p>
        </div>
      </div>
    </main>
  );
}





// "use client";

// import { useState } from "react";
// import axios from "axios";

// export default function Home() {
//   const [file, setFile] = useState<File | null>(null);
//   const [progress, setProgress] = useState<number>(0);
//   const [message, setMessage] = useState<string>("");

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) setFile(e.target.files[0]);
//   };

//   const handleUpload = async () => {
//     if (!file) return alert("Please select a video!");

//     const formData = new FormData();
//     formData.append("video", file);

//     try {
//       const res = await axios.post("http://localhost:8080/api/videos/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//         onUploadProgress: (e) => {
//           if (e.total) {
//             setProgress(Math.round((e.loaded * 100) / e.total));
//           }
//         },
//       });

//       setMessage("✅ " + res.data.message);
//       setProgress(0);
//     } catch (err: any) {
//       setMessage("❌ Upload failed");
//       setProgress(0);
//     }
//   };

//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen gap-4">
//       <h1 className="text-2xl font-bold">🎥 Upload Video</h1>

//       <input type="file" accept="video/*" onChange={handleFileChange} />
//       <button
//         onClick={handleUpload}
//         className="bg-blue-600 text-white px-4 py-2 rounded"
//       >
//         Upload
//       </button>

//       {progress > 0 && (
//         <div className="w-64 bg-gray-200 rounded-full h-4">
//           <div
//             className="bg-blue-500 h-4 rounded-full"
//             style={{ width: `${progress}%` }}
//           ></div>
//         </div>
//       )}

//       {message && <p>{message}</p>}
//     </main>
//   );
// }
