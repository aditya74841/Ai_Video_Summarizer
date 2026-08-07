"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Root Error Boundary caught error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            🚨
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Critical System Error</h1>
            <p className="text-gray-600 text-sm">
              {error?.message || "A root-level layout error prevented the page from rendering properly."}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
