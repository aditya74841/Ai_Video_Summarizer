// import express, { Application, Request, Response } from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "path";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import dotenv from "dotenv";
// import { errorHandler } from "./middleware/error.middleware";
// import videoRoutes from "../src/routes/video.routes";
// const app: Application = express();

// app.use(helmet());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN! || "http://localhost:3000", // use env, fallback for dev
//   })
// );

// app.use(cookieParser());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// app.use("/api/videos", videoRoutes);

// // Health Check Route
// // app.get("/health-check", (req: Request, res: Response) => {
// //   res.status(200).json({
// //     status: "ok",
// //     timestamp: new Date().toISOString(),
// //     uptime: process.uptime(),
// //     message: "Server is running",
// //   });
// // });

// app.use(errorHandler);

// export default app;

import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error.middleware";
import videoRoutes from "./routes/video.routes"

// dotenv.config({
//   path: "./.env",
// });

// dotenv.config({ path: path.resolve(__dirname, "./.env") });

// dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app: Application = express();

app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN! || "http://localhost:3000", // use env, fallback for dev
    credentials: true,
  })
);

// Parse cookies so authentication middleware can read tokens set as cookies
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/videos", videoRoutes);

// Health Check Route
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
// Error Handler (should be last)
app.use(errorHandler);

export default app;
