/**
 * Decodes common HTML entities found in scraped subtitle/caption feeds
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Cleans up WebVTT timestamps, sound effects brackets like [Music], and extra whitespace
 */
export const cleanTranscriptText = (rawText: string): string => {
  if (!rawText) return "";

  let cleaned = decodeHtmlEntities(rawText);

  // Remove timestamps like 00:00:01.000 --> 00:00:04.000 or 00:01:23
  cleaned = cleaned.replace(/\d{2}:\d{2}:\d{2}(?:\.\d{3})?\s*-->\s*\d{2}:\d{2}:\d{2}(?:\.\d{3})?/g, "");
  cleaned = cleaned.replace(/\[(?:Music|Applause|Laughter|Silence|Noise|Sound)\]/gi, "");

  // Collapse multiple spaces or newlines into clean single spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
};

/**
 * Estimates token size (~4 characters per token for English text)
 */
export const estimateTokenCount = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export interface NormalizedTranscriptResult {
  text: string;
  charCount: number;
  estimatedTokens: number;
  isTruncated: boolean;
}

/**
 * Normalizes transcript text and enforces maximum character/token limits (default max: 24,000 chars ~6,000 tokens)
 */
export const normalizeTranscript = (
  rawText: string,
  maxChars: number = 24000
): NormalizedTranscriptResult => {
  const cleaned = cleanTranscriptText(rawText);
  let isTruncated = false;
  let finalText = cleaned;

  if (cleaned.length > maxChars) {
    finalText = cleaned.slice(0, maxChars) + "\n...[Transcript truncated due to length]";
    isTruncated = true;
  }

  return {
    text: finalText,
    charCount: finalText.length,
    estimatedTokens: estimateTokenCount(finalText),
    isTruncated,
  };
};
