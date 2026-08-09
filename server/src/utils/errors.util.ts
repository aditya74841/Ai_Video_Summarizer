export type ProcessingErrorCode =
  | "VIDEO_NOT_FOUND"
  | "TRANSCRIPT_NOT_AVAILABLE"
  | "TRANSCRIPTION_FAILED"
  | "SUMMARY_FAILED"
  | "PROCESSING_TIMEOUT";

export type SuggestedAction = "UPLOAD_FILE" | "TRY_DEMO" | "RETRY";

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
  VIDEO_NOT_FOUND: {
    defaultMessage: "Video record could not be found.",
    userActionMessage: "Please upload your video file again.",
    suggestedAction: "UPLOAD_FILE",
  },
  TRANSCRIPT_NOT_AVAILABLE: {
    defaultMessage: "No transcript available for this video.",
    userActionMessage: "Transcript is missing. Please extract audio and transcribe first.",
    suggestedAction: "RETRY",
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
    defaultMessage: "The operation timed out.",
    userActionMessage: "Processing took longer than expected. Please try again.",
    suggestedAction: "RETRY",
  },
};

export const createAppError = (
  code: ProcessingErrorCode,
  overrideMessage?: string
): ApplicationError => {
  const mapping = ERROR_MAPPINGS[code] || ERROR_MAPPINGS.TRANSCRIPTION_FAILED;
  return {
    success: false,
    code,
    message: overrideMessage || mapping.defaultMessage,
    userActionMessage: mapping.userActionMessage,
    suggestedAction: mapping.suggestedAction,
  };
};
