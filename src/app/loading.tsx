export default function Loading() {
  return (
    <main className="min-h-screen bg-[#080c14] text-neutral-200 p-6 md:p-14">
      <div
        className="max-w-7xl mx-auto h-80 rounded-3xl border border-white/[0.08] bg-[#0e131f]/50 flex flex-col items-center justify-center gap-3"
        role="status"
        aria-live="polite"
      >
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" aria-hidden="true" />
        <span className="text-xs text-neutral-400 font-mono">
          Loading classmates and syncing GitHub metrics…
        </span>
      </div>
    </main>
  );
}
