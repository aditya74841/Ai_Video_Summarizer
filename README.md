
# AI Video Summarizer

Transform long-form videos and YouTube content into accurate transcripts and AI-powered executive summaries. Built with a real-time processing pipeline, dual AI provider fallback, and offline caching.

## 🔗 Live Demo
**[videosummary.iamadityaranjan.com](https://videosummary.iamadityaranjan.com)**

## ✨ Features

- **Dual Input Sources:** Upload local video files (MP4, MKV, MOV, WEBM ≤20MB, ≤12min) or paste any YouTube URL
- **Real-Time Processing:** Live SSE progress streaming for upload, audio extraction, transcription, and summarization
- **Dual Summary Modes:** 
  - ⚡ **Short Overview:** 2-3 concise sentences + 3 core takeaways
  - 🔍 **Detailed Analysis:** Executive summary + in-depth breakdown + actionable takeaways
- **Editable Transcripts:** Review and correct raw speech-to-text before generating summaries
- **Custom Audio Player:** Inline audio preview with seekable timeline and waveform progress
- **7-Day Offline History:** Automatic client-side caching via IndexedDB with background cleanup
- **One-Click Export:** Download summaries as `.md` (Markdown) files
- **Zero Signup Required:** Open the app and start processing immediately

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router) + React 18
- **Language:** TypeScript
- **Styling:** Vanilla CSS with CSS variables, glassmorphism, dark-mode design system
- **State Management:** Custom `useVideoPipeline` hook with SSE integration
- **Offline Storage:** Browser IndexedDB (7-day automatic retention)
- **UI:** react-hot-toast notifications

### Backend
- **Runtime:** Node.js + Express.js (TypeScript)
- **Database:** MongoDB with Mongoose ODM
- **Media Processing:** ffmpeg-static + ffprobe-static + ytdlp-nodejs
- **Real-Time:** Server-Sent Events (SSE) for live progress updates
- **Security:** Helmet (CSP), CORS, express-rate-limit

### AI Providers
- **Transcription:** Groq API (`whisper-large-v3-turbo`)
- **Primary LLM:** Groq API (`llama-3.3-70b-versatile`)

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js 14    │────▶│  Express.js API  │────▶│   MongoDB       │
│  (React + TS)   │     │  (Node.js + TS)  │     │   (Mongoose)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────┐
        │               │  FFmpeg / yt-dlp │
        │               │  (Audio Extract) │
        │               └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  IndexedDB      │     │  Groq / Gemini   │
│  (7-Day Cache)  │     │  (Transcribe +   │
│                 │     │   Summarize)     │
└─────────────────┘     └──────────────────┘
```

### Pipeline Stages
1. **Upload** → FFprobe validates duration (≤12m) & size (≤20MB)
2. **Extract Audio** → FFmpeg converts to 16kHz Mono MP3 (original video deleted)
3. **Transcribe** → Groq Whisper processes audio (audio file deleted after)
4. **Summarize** → Groq LLaMA 3.3 70B generates summary 
5. **Cache** → Result saved to IndexedDB for 7-day offline access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Groq API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/aditya74841/Ai_Video_Summarizer.git
cd Ai_Video_Summarizer

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `.env` files in both `server/` and `client/` directories:

**Server (`server/.env`):**
```env
PORT=8080
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_google_key
```

**Client (`client/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Running Locally

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Start the client
cd client
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload local video file |
| POST | `/api/youtube/download` | Download YouTube audio |
| POST | `/api/videos/extract-audio/:id` | Extract audio via FFmpeg |
| GET | `/api/videos/transcribe/:id` | Transcribe audio (SSE stream) |
| POST | `/api/videos/summarize/:id` | Generate AI summary |
| DELETE | `/api/videos/reset/:id` | Clean up temporary files |

## 👤 About the Builder

Built by **[Aditya Ranjan](https://linkedin.com/in/iamadityaranjan)** — Full-Stack Developer specializing in AI-powered web applications and real-time data pipelines.

- 💼 Open for freelance projects and full-time roles
- 🌐 Portfolio: [iamadityaranjan.com](https://iamadityaranjan.com)
- 💻 GitHub: [@aditya74841](https://github.com/aditya74841)

## 📄 License

MIT © Aditya Ranjan
