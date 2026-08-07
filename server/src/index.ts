// import cors from "cors";

// import "dotenv/config";
// import express from "express";
// import { router } from "./routes";
// import { errorHandler } from "./middlewares/errorHandler";

// const app = express();

// app.use(express.json());

// app.use(cors({ origin: "*" }));

// app.get("/", (req, res) => {
//   res.json({
//     message: "AI Video Summariser server is running",
//   });
// });

// app.use("/api", router);
// app.use(errorHandler);

// const port = process.env.PORT || 3000;

import "dotenv/config";
import app from "./app";
import { connectDB } from "./db/intex";
// import dotenv from "dotenv";

// dotenv.config({
//   path: "./.env",
// });

// dotenv.config({
//   path: "./.env",
// });

// dotenv.config({ path: path.resolve(__dirname, "./.env") });

// dotenv.config();

const PORT = process.env.PORT! || 8000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
