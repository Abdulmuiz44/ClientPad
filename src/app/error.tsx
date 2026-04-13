"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an observability provider
    console.error("Global runtime error:", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">Something went wrong</h1>
          <p className="mt-4 text-sm text-slate-600">
            A critical application error occurred. We have been notified and are looking into it.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => reset()}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Return home
            </Link>
          </div>
          {process.env.NODE_ENV === "development" ? (
            <div className="mt-8 rounded bg-red-50 p-4 font-mono text-xs text-red-900">
              <p className="font-bold">{error.name}: {error.message}</p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.stack}</pre>
            </div>
          ) : null}
        </div>
      </body>
    </html>
  );
}
