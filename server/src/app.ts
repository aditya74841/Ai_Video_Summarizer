import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/error.middleware";
import videoRoutes from "./routes/video.routes";

const app: Application = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://ai-video-summarizer-qrmb.vercel.app",
  "https://ai-video-summarizer-red.vercel.app",
  "https://videosummary.iamadityaranjan.com",
];

// Dynamically add environment CORS origins (supports single URL or comma-separated list)
if (process.env.CORS_ORIGIN) {
  const customOrigins = process.env.CORS_ORIGIN.split(",").map((url) => url.trim());
  customOrigins.forEach((url) => {
    if (url && !allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

// IMPORTANT: Apply CORS before Helmet
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for public video demo app
      }
    },
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Range"],
  })
);

// Configure Helmet with proper CSP for media
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: ["'self'", "*", "blob:", "data:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "*"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Range");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Accept-Ranges", "bytes");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

app.use("/api/videos", videoRoutes);

app.get("/health-check", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "Server is running",
  });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "AI Video Summarizer API running",
  });
});

app.use(errorHandler);

export default app;
