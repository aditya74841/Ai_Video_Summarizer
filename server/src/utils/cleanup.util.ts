import fs from "fs";
import path from "path";

/**
 * Periodically cleans up temporary files in uploads/ and uploads/audio/
 * that are older than maxAgeMs (default: 1 hour = 3600000 ms)
 */
export const cleanupStaleFiles = (maxAgeMs: number = 3600000) => {
  const dirsToClean = [
    path.join(__dirname, "../../uploads"),
    path.join(__dirname, "../../uploads/audio"),
  ];

  const now = Date.now();
  let purgedCount = 0;

  dirsToClean.forEach((dir) => {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile() && now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            purgedCount++;
          }
        } catch {
          // Skip if file is being locked or deleted by active stream
        }
      });
    } catch (err) {
      console.warn(`⚠️ Cleanup warning for ${dir}:`, err);
    }
  });

  if (purgedCount > 0) {
    console.log(`🗑️ Auto-cleanup: Removed ${purgedCount} stale temporary file(s) older than ${Math.round(maxAgeMs / 60000)} minutes`);
  }
};

/**
 * Schedule recurring background cleanup (runs every 30 minutes)
 */
export const startBackgroundCleanup = () => {
  // Run once immediately on server startup
  cleanupStaleFiles();

  // Run every 30 minutes (1800000 ms)
  setInterval(() => {
    cleanupStaleFiles();
  }, 30 * 60 * 1000);
};
