import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error.middleware";
import videoRoutes from "./routes/video.routes";

const app: Application = express();

// IMPORTANT: Apply CORS before Helmet
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ai-video-summarizer-qrmb.vercel.app",
      "https://ai-video-summarizer-red.vercel.app",
    ],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Range"], // Important for media
  })
);

// Configure Helmet with proper CSP for media
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        mediaSrc: [
          "'self'",
          "http://localhost:8080",
          "http://localhost:3000",
          "https://ai-video-summarizer-ie74.onrender.com",
          "https://ai-video-summarizer-red.vercel.app",
          "blob:",
          "data:",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "http://localhost:8080", "http://localhost:3000"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Critical for media files
    crossOriginEmbedderPolicy: false, // Disable if causing issues
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

// CRITICAL: Static files middleware with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers for static files
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Range");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Accept-Ranges", "bytes"); // Important for audio seeking
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
    message: "Server is running",
  });
});

app.use(errorHandler);

export default app;


// import express, { Application, Request, Response } from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "path";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import dotenv from "dotenv";
// import { errorHandler } from "./middleware/error.middleware";
// import videoRoutes from "./routes/video.routes"

// // dotenv.config({
// //   path: "./.env",
// // });

// // dotenv.config({ path: path.resolve(__dirname, "./.env") });

// // dotenv.config({ path: path.resolve(__dirname, "../.env") });

// const app: Application = express();

// // app.use(helmet());
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         mediaSrc: [
//           "'self'", 
//           "http://localhost:8080",
//           "https://ai-video-summarizer-ie74.onrender.com",
//           "blob:", 
//           "data:"
//         ],
//         scriptSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: ["'self'", "data:", "blob:"],
//       },
//     },
//   })
// );

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// // app.use(
// //   cors({
// //     origin: [
// //       "https://ai-video-summarizer-qrmb.vercel.app",
// //       "https://ai-video-summarizer-red.vercel.app",
// //       "http://localhost:3000",
// //       "*"
// //     ],
// //     credentials: true,
// //   })
// // );

// app.use(
//   cors({
//     origin: ["*"], 
   
//   })
// );
// // Parse cookies so authentication middleware can read tokens set as cookies
// app.use(cookieParser());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// app.use("/api/videos", videoRoutes);

// // Health Check Route
// app.get("/health-check", (req: Request, res: Response) => {
//   res.status(200).json({
//     status: "ok",
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     message: "Server is running",
//   });
// });
// app.get("/", (req: Request, res: Response) => {
//   res.status(200).json({
//     status: "ok",
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     message: "Server is running",
//   });
// });
// // Error Handler (should be last)
// app.use(errorHandler);

// export default app;
