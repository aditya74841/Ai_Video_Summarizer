import mongoose from "mongoose";

export let dbInstance: typeof mongoose | null = null;

const connectDB = async (): Promise<void> => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aivideoSummariser";

    const connectionInstance = await mongoose.connect(MONGODB_URI);
    dbInstance = connectionInstance;
    console.log(`✅ MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export { connectDB };
