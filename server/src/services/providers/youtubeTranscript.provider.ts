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

  private async fetchCaptionsViaProxiedPage(videoId: string): Promise<string | null> {
    const proxyUrl = getRandomProxy();
    if (!proxyUrl) return null;

    try {
      const agent = getProxyAgent(proxyUrl);
      console.log(`📡 [YouTubeCaptionProvider] Fetching watch page via Webshare proxy...`);

      const reqInit: any = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        agent,
      };

      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, reqInit);

      if (!res.ok) return null;
      const html = await res.text();
      const match = html.match(/"captionTracks":\s*(\[.*?\])/);
      if (!match) return null;

      const tracks = JSON.parse(match[1]);
      if (!Array.isArray(tracks) || tracks.length === 0) return null;

      const track =
        tracks.find((t: any) => t.languageCode === "en" || (t.languageCode && t.languageCode.startsWith("en"))) ||
        tracks[0];

      if (!track || !track.baseUrl) return null;

      const xmlInit: any = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        agent,
      };

      const xmlRes = await fetch(track.baseUrl, xmlInit);

      if (!xmlRes.ok) return null;
      const xml = await xmlRes.text();
      const textMatches = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/g)];

      if (textMatches.length === 0) return null;

      const lines = textMatches
        .map((m) =>
          m[1]
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/<[^>]*>/g, "")
        )
        .filter((line) => line.trim().length > 0);

      if (lines.length > 0) {
        console.log(`✅ [YouTubeCaptionProvider] Proxied XML caption fetch succeeded (${lines.length} lines)`);
        return lines.join(" ");
      }
    } catch (err: any) {
      console.warn("⚠️ [YouTubeCaptionProvider] Proxied page caption fetch error:", err.message || err);
    }
    return null;
  }

  public async getTranscript(input: IngestionInput): Promise<IngestionResult | null> {
    if (!input.youtubeUrl || !input.videoId) return null;

    try {
      console.log(`🌐 [YouTubeCaptionProvider] Attempting caption extraction for Video ID: ${input.videoId}`);

      let rawText: string | null = null;
      let durationEstimate = 0;

      // Strategy 1: Primary Proxied Page Caption Extractor (Uses Webshare Proxy)
      if (getRandomProxy()) {
        rawText = await this.fetchCaptionsViaProxiedPage(input.videoId);
      }

      // Strategy 2: Fallback to YoutubeTranscript package
      if (!rawText) {
        console.log(`🌐 [YouTubeCaptionProvider] Trying YoutubeTranscript package fallback...`);
        const timeoutMs = 7000;
        const fetchPromise = (async () => {
          let items: any[] = [];
          try {
            items = await YoutubeTranscript.fetchTranscript(input.videoId!);
          } catch {
            items = await YoutubeTranscript.fetchTranscript(input.youtubeUrl);
          }
          return items;
        })();

        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error("YouTube caption fetch timed out")), timeoutMs)
        );

        const items = await Promise.race([fetchPromise, timeoutPromise]);
        if (items && items.length > 0) {
          rawText = items.map((item) => item.text).join(" ");
          const lastChunk = items[items.length - 1];
          if (lastChunk && lastChunk.offset) {
            durationEstimate = Math.round((lastChunk.offset + lastChunk.duration) / 1000);
          }
        }
      }

      if (rawText && rawText.trim().length > 0) {
        const normalized = normalizeTranscript(rawText);
        const videoTitle = input.title || (await this.fetchTitleViaApi(input.youtubeUrl, input.videoId));

        console.log(`✅ [YouTubeCaptionProvider] Captions ready (${normalized.charCount} chars)`);

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
