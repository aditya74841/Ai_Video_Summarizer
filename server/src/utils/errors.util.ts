export type ProcessingErrorCode =
  | "INVALID_YOUTUBE_URL"
  | "VIDEO_NOT_FOUND"
  | "TRANSCRIPT_NOT_AVAILABLE"
  | "YOUTUBE_ACCESS_RESTRICTED"
  | "MEDIA_DOWNLOAD_FAILED"
  | "TRANSCRIPTION_FAILED"
  | "SUMMARY_FAILED"
  | "PROCESSING_TIMEOUT";

export type SuggestedAction = "UPLOAD_FILE" | "TRY_DEMO" | "RETRY" | "CHECK_URL";

export interface ApplicationError {
  success: false;
  code: ProcessingErrorCode;
  message: string;
  userActionMessage: string;
  suggestedAction: SuggestedAction;
}

export const ERROR_MAPPINGS: Record<
  ProcessingErrorCode,
  { defaultMessage: string; userActionMessage: string; suggestedAction: SuggestedAction }
> = {
  INVALID_YOUTUBE_URL: {
    defaultMessage: "The provided URL is not a valid YouTube video link.",
    userActionMessage: "Please check the URL format and try again (e.g. https://www.youtube.com/watch?v=...).",
    suggestedAction: "CHECK_URL",
  },
  VIDEO_NOT_FOUND: {
    defaultMessage: "YouTube video could not be found or has been removed/made private.",
    userActionMessage: "Verify that the video is public and accessible on YouTube.",
    suggestedAction: "CHECK_URL",
  },
  TRANSCRIPT_NOT_AVAILABLE: {
    defaultMessage: "No captions or transcript available for this YouTube video.",
    userActionMessage: "This video lacks automated subtitles. Try uploading the video file directly.",
    suggestedAction: "UPLOAD_FILE",
  },
  YOUTUBE_ACCESS_RESTRICTED: {
    defaultMessage: "YouTube automated access is restricted on cloud server IP.",
    userActionMessage: "YouTube restricted automated server access for this video. You can upload the video file directly or try our 1-Click Demo Video!",
    suggestedAction: "UPLOAD_FILE",
  },
  MEDIA_DOWNLOAD_FAILED: {
    defaultMessage: "Failed to download media stream from YouTube.",
    userActionMessage: "Media download failed. Please upload your video file directly.",
    suggestedAction: "UPLOAD_FILE",
  },
  TRANSCRIPTION_FAILED: {
    defaultMessage: "Speech-to-text audio transcription failed.",
    userActionMessage: "Transcription service was unable to process the audio. Please retry.",
    suggestedAction: "RETRY",
  },
  SUMMARY_FAILED: {
    defaultMessage: "AI Summarization failed to generate summary.",
    userActionMessage: "AI service rate limit or failure occurred. Please try generating again.",
    suggestedAction: "RETRY",
  },
  PROCESSING_TIMEOUT: {
    defaultMessage: "The operation timed out while communicating with YouTube.",
    userActionMessage: "Processing took longer than expected. Please try again or upload the video file directly.",
    suggestedAction: "UPLOAD_FILE",
  },
};

export const createAppError = (
  code: ProcessingErrorCode,
  overrideMessage?: string
): ApplicationError => {
  const mapping = ERROR_MAPPINGS[code] || ERROR_MAPPINGS.YOUTUBE_ACCESS_RESTRICTED;
  return {
    success: false,
    code,
    message: overrideMessage || mapping.defaultMessage,
    userActionMessage: mapping.userActionMessage,
    suggestedAction: mapping.suggestedAction,
  };
};
