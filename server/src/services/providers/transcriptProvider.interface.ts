export interface IngestionInput {
  youtubeUrl: string;
  videoId: string | null;
  jobId: string;
  title?: string;
}

export interface IngestionResult {
  providerName: "youtube_captions" | "youtube_media_whisper" | "local_upload";
  transcript: string;
  title: string;
  duration?: number;
  audioPath?: string;
  audioUrl?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface TranscriptProvider {
  name: string;
  canHandle(input: IngestionInput): boolean;
  getTranscript(input: IngestionInput): Promise<IngestionResult | null>;
}
