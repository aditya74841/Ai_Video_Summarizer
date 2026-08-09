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
    const fetchOptions: any = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    };

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

  /**
   * Proxied execution wrapper for YoutubeTranscript package.
   * Dynamically injects Webshare Proxy Agent into all network requests.
   */
  private async fetchWithProxiedYoutubeTranscript(videoId: string, youtubeUrl: string): Promise<any[]> {
    const proxyUrl = getRandomProxy();
    const originalFetch = (global as any).fetch;

    if (proxyUrl) {
      const agent = getProxyAgent(proxyUrl);
      if (agent) {
        (global as any).fetch = function (url: any, opts: any = {}) {
          return originalFetch(url, { ...opts, agent });
        };
      }
    }

    try {
      let items: any[] = [];
      try {
        items = await YoutubeTranscript.fetchTranscript(videoId);
      } catch {
        items = await YoutubeTranscript.fetchTranscript(youtubeUrl);
      }
      return items;
    } finally {
      (global as any).fetch = originalFetch;
    }
  }

  public async getTranscript(input: IngestionInput): Promise<IngestionResult | null> {
    if (!input.youtubeUrl || !input.videoId) return null;

    try {
      console.log(`🌐 [YouTubeCaptionProvider] Attempting caption extraction for Video ID: ${input.videoId}`);

      const timeoutMs = 8000;
      const fetchPromise = this.fetchWithProxiedYoutubeTranscript(input.videoId, input.youtubeUrl);

      const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error("YouTube caption fetch timed out")), timeoutMs)
      );

      const items = await Promise.race([fetchPromise, timeoutPromise]);

      if (items && items.length > 0) {
        const rawText = items.map((item) => item.text).join(" ");
        const normalized = normalizeTranscript(rawText);

        const lastChunk = items[items.length - 1];
        const durationEstimate =
          lastChunk && lastChunk.offset ? Math.round((lastChunk.offset + lastChunk.duration) / 1000) : 0;

        const videoTitle = input.title || (await this.fetchTitleViaApi(input.youtubeUrl, input.videoId));

        console.log(`✅ [YouTubeCaptionProvider] Captions extracted via Webshare Proxy (${normalized.charCount} chars)`);

        return {
          providerName: "youtube_captions",
          transcript: normalized.text,
          title: videoTitle,
          duration: durationEstimate,
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
