"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#080c14] text-neutral-200 p-6 md:p-14">
      <div
        role="alert"
        className="max-w-xl mx-auto p-8 rounded-3xl border border-rose-900/40 bg-rose-950/20 text-center space-y-3"
      >
        <h2 className="text-lg font-bold text-rose-200">Something went wrong</h2>
        <p className="text-xs text-neutral-400">
          The leaderboard failed to load. Please try again.
          {error.digest ? ` (ref ${error.digest})` : ""}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
