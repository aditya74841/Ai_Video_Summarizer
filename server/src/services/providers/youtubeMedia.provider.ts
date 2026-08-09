import { YtDlp } from "ytdlp-nodejs";
import path from "path";
import fs from "fs";
import { IngestionInput, IngestionResult, TranscriptProvider } from "./transcriptProvider.interface";
import { getRandomProxy } from "../../utils/proxy.util";
import { getAudioMetadata } from "../../utils/ffmpeg.util";
import { sendProgress } from "../../utils/progress.util";

const ytdlp = new YtDlp();

export class YouTubeMediaProvider implements TranscriptProvider {
  public name = "YouTubeMediaProvider";

  public canHandle(input: IngestionInput): boolean {
    return Boolean(input.youtubeUrl);
  }

  public async getTranscript(input: IngestionInput): Promise<IngestionResult | null> {
    if (!input.youtubeUrl) return null;

    const proxyUrl = getRandomProxy();
    const additionalOptions: string[] = [
      "--extractor-args",
      "youtube:player_client=android,web",
      "--no-warnings",
    ];

    if (proxyUrl) {
      console.log(`📡 [YouTubeMediaProvider] Using Webshare proxy: ${proxyUrl.replace(/:[^:@]+@/, ":****@")}`);
      additionalOptions.push("--proxy", proxyUrl);
    }

    console.log(`🔄 [YouTubeMediaProvider] Fetching video metadata via yt-dlp...`);
    let videoInfo: any;
    try {
      videoInfo = await ytdlp.getInfoAsync(input.youtubeUrl, { additionalOptions } as any);
    } catch (infoError: any) {
      console.warn("⚠️ [YouTubeMediaProvider] yt-dlp getInfoAsync failed:", infoError.message || infoError);
      throw infoError;
    }

    if (videoInfo._type === "playlist") {
      throw new Error("Playlists are not supported. Please provide a single video URL.");
    }

    const videoTitle = input.title || videoInfo.title || "YouTube Video";
    const duration = videoInfo.duration;

    if (duration && duration > 720) {
      throw new Error(`YouTube video duration (${Math.round(duration / 60)} mins) exceeds maximum 12-minute limit.`);
    }

    const audioDir = path.join(__dirname, "../../../uploads/audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioOutputPath = path.join(audioDir, `${input.jobId}.mp3`);
    const ffmpegPath = require("ffmpeg-static");

    sendProgress(input.jobId, "downloading", 10, "Downloading YouTube Audio Stream...");

    const downloadOptions = [
      ...additionalOptions,
      "--ffmpeg-location",
      ffmpegPath,
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--postprocessor-args",
      "-ar 16000 -ac 1",
    ];

    try {
      await ytdlp.downloadAsync(input.youtubeUrl, {
        format: { filter: "audioonly", quality: 9, type: "mp3" },
        output: audioOutputPath,
        additionalOptions: downloadOptions,
        onProgress: (progress) => {
          if (progress.percentage) {
            sendProgress(
              input.jobId,
              "downloading",
              Math.round(progress.percentage),
              `Downloading YouTube Audio (${Math.round(progress.percentage)}%)`
            );
          }
        },
      });
    } catch (dlErr: any) {
      if (fs.existsSync(audioOutputPath)) {
        try { fs.unlinkSync(audioOutputPath); } catch {}
      }
      throw dlErr;
    }

    // Verify audio file creation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!fs.existsSync(audioOutputPath)) {
      throw new Error("Audio file was not created successfully by yt-dlp.");
    }

    const stats = fs.statSync(audioOutputPath);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
    const relativeAudioPath = `uploads/audio/${input.jobId}.mp3`;
    const audioUrl = `${baseUrl}/${relativeAudioPath}`;
    const metadata = await getAudioMetadata(audioOutputPath);

    sendProgress(input.jobId, "audio_extracted", 100, "16kHz Mono Audio Stream Extracted");

    return {
      providerName: "youtube_media_whisper",
      transcript: "", // Signifies that Whisper audio transcription is needed
      title: videoTitle,
      duration: duration || metadata.duration,
      audioPath: audioOutputPath,
      audioUrl,
      size: stats.size,
      metadata: {
        sampleRate: metadata.sampleRate || 16000,
        channels: metadata.channels || 1,
        bitrate: metadata.bitrate,
      },
    };
  }
}
