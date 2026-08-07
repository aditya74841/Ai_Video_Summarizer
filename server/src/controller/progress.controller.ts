import { Request, Response } from "express";
import { addSSEClient, removeSSEClient } from "../utils/progress.util";

export const getProgressStream = (req: Request, res: Response) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  addSSEClient(id, res);

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ videoId: id, stage: "connected", percentage: 0, message: "Real-time connection established" })}\n\n`);

  req.on("close", () => {
    removeSSEClient(res);
  });
};
