"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-950 text-white flex min-h-screen flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">Application Error</h2>
        <p className="text-sm text-slate-400 mb-4">{error.message || "An unhandled error occurred."}</p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
