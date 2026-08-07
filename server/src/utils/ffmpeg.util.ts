import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface AudioMetadata {
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

/**
 * Extract audio metadata using ffprobe
 */
export const getAudioMetadata = async (filePath: string): Promise<AudioMetadata> => {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    const parsed = JSON.parse(stdout);
    const audioStream = parsed.streams?.find((s: any) => s.codec_type === "audio") || parsed.streams?.[0];
    const format = parsed.format || {};

    return {
      duration: format.duration ? parseFloat(format.duration) : undefined,
      sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
      channels: audioStream?.channels ? parseInt(audioStream.channels, 10) : undefined,
      bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
    };
  } catch (error) {
    console.warn("ffprobe metadata extraction warning:", error);
    return {};
  }
};

/**
 * Optimize audio file to 16kHz Mono MP3 for Whisper AI processing
 */
export const convertTo16kMonoMp3 = async (inputPath: string, outputPath: string): Promise<void> => {
  // -ar 16000: 16kHz sampling rate optimized for vocal recognition (Whisper / Speech-to-Text)
  // -ac 1: Mono channel (reduces payload by 50% compared to stereo)
  // -c:a libmp3lame -b:a 64k: Efficient 64kbps MP3 audio compression
  await execPromise(
    `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -c:a libmp3lame -b:a 64k "${outputPath}"`
  );
};
