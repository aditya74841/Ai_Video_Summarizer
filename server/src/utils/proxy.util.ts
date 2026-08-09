const { HttpsProxyAgent } = require("https-proxy-agent");

/**
 * Normalizes a proxy string into standard URL format: http://user:pass@ip:port
 */
export const formatProxyString = (str: string): string | null => {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("socks5://")) {
    return trimmed;
  }
  // Check IP:PORT:USER:PASS format from Webshare dashboard export
  const parts = trimmed.split(":");
  if (parts.length === 4) {
    const [ip, port, user, pass] = parts;
    return `http://${user}:${pass}@${ip}:${port}`;
  }
  return null;
};

/**
 * Helper to parse proxy strings from environment variables
 * Supports WEBSHARE_PROXIES, WEBSHARE_PROXY_URL, or PROXY_LIST
 */
export const getProxyList = (): string[] => {
  const rawProxies =
    process.env.WEBSHARE_PROXIES ||
    process.env.PROXY_LIST ||
    process.env.WEBSHARE_PROXY_URL ||
    "";

  if (!rawProxies.trim()) return [];

  // Handle JSON array string
  if (rawProxies.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(rawProxies);
      if (Array.isArray(parsed)) {
        return parsed
          .map((p) => formatProxyString(String(p)))
          .filter((p): p is string => p !== null);
      }
    } catch {}
  }

  // Handle comma or newline separated proxy strings
  return rawProxies
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .map((p) => formatProxyString(p))
    .filter((p): p is string => p !== null);
};

/**
 * Randomly picks a proxy URL from the configured proxy pool
 */
export const getRandomProxy = (): string | null => {
  const proxies = getProxyList();
  if (proxies.length === 0) return null;
  const index = Math.floor(Math.random() * proxies.length);
  return proxies[index];
};

/**
 * Returns an HttpsProxyAgent instance for a proxy URL (or picks random if not provided)
 */
export const getProxyAgent = (specificProxyUrl?: string): any => {
  const proxyUrl = specificProxyUrl || getRandomProxy();
  if (!proxyUrl) return undefined;
  try {
    return new HttpsProxyAgent(proxyUrl);
  } catch (err) {
    console.warn("⚠️ Failed to initialize HttpsProxyAgent:", err);
    return undefined;
  }
};
