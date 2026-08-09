import { YoutubeTranscript } from "youtube-transcript";
import { IngestionInput, IngestionResult, TranscriptProvider } from "./transcriptProvider.interface";
import { normalizeTranscript } from "../../utils/transcriptNormalizer.util";
import { getProxyAgent, getRandomProxy } from "../../utils/proxy.util";

export class YouTubeTranscriptProvider implements TranscriptProvider {
  public name = "YouTubeCaptionProvider";

  public canHandle(input: IngestionInput): boolean {
    return Boolean(input.youtubeUrl && input.videoId);
  }

  private async fetchTitleViaApi(url: string, videoId: string | null): Promise<string> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const proxyUrl = getRandomProxy();
    const fetchOptions: any = {};

    if (proxyUrl) {
      const agent = getProxyAgent(proxyUrl);
      if (agent) fetchOptions.agent = agent;
    }

    if (apiKey && videoId) {
      try {
        const apiRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
          fetchOptions
        );
        if (apiRes.ok) {
          const data: any = await apiRes.json();
          if (data.items && data.items.length > 0 && data.items[0].snippet?.title) {
            console.log(`✅ Fetched official title via Google YouTube Data API v3: "${data.items[0].snippet.title}"`);
            return data.items[0].snippet.title;
          }
        }
      } catch (err) {
        console.warn("⚠️ Google YouTube API title fetch warning:", err);
      }
    }

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        fetchOptions
      );
      if (oembedRes.ok) {
        const data: any = await oembedRes.json();
        if (data && data.title) return data.title;
      }
    } catch (err) {
      console.warn("⚠️ oEmbed title fetch failed:", err);
    }

    return "YouTube Video";
  }

  public async getTranscript(input: IngestionInput): Promise<IngestionResult | null> {
    if (!input.youtubeUrl || !input.videoId) return null;

    try {
      console.log(`🌐 [YouTubeCaptionProvider] Attempting caption extraction for Video ID: ${input.videoId}`);

      // Create a timeout promise to prevent hanging on slow YouTube responses
      const timeoutMs = 6000;
      const fetchPromise = (async () => {
        let items: any[] = [];
        try {
          items = await YoutubeTranscript.fetchTranscript(input.videoId!);
        } catch (idErr) {
          console.warn("⚠️ YoutubeTranscript failed with videoId, trying full URL...", idErr);
          items = await YoutubeTranscript.fetchTranscript(input.youtubeUrl);
        }
        return items;
      })();

      const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("YouTube caption fetch timed out (6s)")), timeoutMs)
      );

      const transcriptItems = await Promise.race([fetchPromise, timeoutPromise]);

      if (transcriptItems && transcriptItems.length > 0) {
        const rawText = transcriptItems.map((item) => item.text).join(" ");
        const normalized = normalizeTranscript(rawText);

        const lastChunk = transcriptItems[transcriptItems.length - 1];
        const estimatedDuration = lastChunk
          ? Math.round((lastChunk.offset + lastChunk.duration) / 1000)
          : 0;

        const videoTitle = input.title || (await this.fetchTitleViaApi(input.youtubeUrl, input.videoId));

        console.log(`✅ [YouTubeCaptionProvider] Successfully extracted captions (${normalized.charCount} chars)`);

        return {
          providerName: "youtube_captions",
          transcript: normalized.text,
          title: videoTitle,
          duration: estimatedDuration,
          metadata: {
            estimatedTokens: normalized.estimatedTokens,
            isTruncated: normalized.isTruncated,
          },
        };
      }
    } catch (err: any) {
      console.warn("⚠️ [YouTubeCaptionProvider] Caption extraction failed or unavailable:", err.message || err);
    }

    return null;
  }
}
