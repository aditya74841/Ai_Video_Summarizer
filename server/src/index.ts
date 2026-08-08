import "dotenv/config";
import app from "./app";
import { connectDB } from "./db/index";
import { startBackgroundCleanup } from "./utils/cleanup.util";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();

    // Start background file garbage collector for ephemeral disk safety
    startBackgroundCleanup();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
