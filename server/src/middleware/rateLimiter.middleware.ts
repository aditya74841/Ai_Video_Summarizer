import rateLimit from "express-rate-limit";

// Rate limiter for transcribe endpoint - 1 request per minute per IP
export const transcribeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: "You can only transcribe 1 video per minute. Please wait before making another request.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for summarize endpoint - 1 request per minute per IP
export const summarizeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per windowMs
  message: "You can only summarize 1 video per minute. Please wait before making another request.",
  standardHeaders: true,
  legacyHeaders: false,
});

