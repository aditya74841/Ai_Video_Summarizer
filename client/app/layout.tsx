import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Video Summarizer — Turn YouTube & Videos into Text Instantly",
  description:
    "Free AI-powered video summarizer. Upload MP4/MOV files or paste YouTube links. Get transcripts and executive summaries with Groq & Gemini AI. Built with Next.js & FFmpeg.",
  keywords: [
    "AI Video Summarizer",
    "YouTube Summarizer",
    "Video Transcription",
    "Speech to Text",
    "Groq Whisper",
    "Gemini AI",
    "Executive Summary Generator",
    "Video Intelligence",
  ],
  authors: [{ name: "Aditya Ranjan" }],
  openGraph: {
    title: "AI Video Summarizer — Turn YouTube & Videos into Text Instantly",
    description:
      "Free AI-powered video summarizer. Upload MP4/MOV files or paste YouTube links. Get transcripts and executive summaries with Groq & Gemini AI.",
    type: "website",
    siteName: "AI Video Summarizer",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Summarizer — Turn YouTube & Videos into Text Instantly",
    description:
      "Free AI-powered video summarizer. Upload MP4/MOV files or paste YouTube links. Get transcripts and executive summaries with Groq & Gemini AI.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        {children}
      </body>
    </html>
  );
}
