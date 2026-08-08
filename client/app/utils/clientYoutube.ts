/**
 * Client-side helper to extract YouTube transcript directly from the user's browser,
 * bypassing cloud hosting provider IP bans (Render/Vercel/AWS).
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

export const fetchClientYouTubeData = async (
  youtubeUrl: string
): Promise<{ transcript: string; title: string } | null> => {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return null;

  // 1. Fetch title via Google's official CORS-enabled oEmbed endpoint
  let title = "YouTube Video";
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data && data.title) {
        title = data.title;
      }
    }
  } catch (err) {
    console.warn("⚠️ Client-side oEmbed title fetch warning:", err);
  }

  // 2. Fetch transcript via public CORS-friendly client microservices
  const transcriptEndpoints = [
    `https://youtube-transcript-api.vercel.app/api/transcript?v=${videoId}`,
    `https://yt-transcript-api.vercel.app/transcript?v=${videoId}`,
  ];

  for (const endpoint of transcriptEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const fullTranscript = items
            .map((item: any) => item.text || item.chunk || "")
            .filter(Boolean)
            .join(" ")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');

          if (fullTranscript.trim().length > 0) {
            console.log("✅ Extracted YouTube transcript client-side in browser!");
            return { transcript: fullTranscript, title };
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Client transcript endpoint ${endpoint} failed:`, err);
    }
  }

  return null;
};
