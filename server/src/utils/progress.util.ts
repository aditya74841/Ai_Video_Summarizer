import { Response } from "express";

interface SSEClient {
  videoId: string;
  res: Response;
}

const clients: SSEClient[] = [];

export const addSSEClient = (videoId: string, res: Response) => {
  clients.push({ videoId, res });
};

export const removeSSEClient = (res: Response) => {
  const index = clients.findIndex((c) => c.res === res);
  if (index !== -1) {
    clients.splice(index, 1);
  }
};

export const sendProgress = (
  videoId: string,
  stage: string,
  percentage: number,
  message: string
) => {
  const targetClients = clients.filter((c) => c.videoId === videoId);
  const data = JSON.stringify({ videoId, stage, percentage, message, timestamp: Date.now() });

  targetClients.forEach((client) => {
    client.res.write(`data: ${data}\n\n`);
  });
};
