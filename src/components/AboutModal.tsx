import React, { useEffect, useId, useRef } from "react";
import { Info, X, ShieldAlert, Cpu, Sparkles } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-xl p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h3 id={titleId} className="text-lg font-bold text-white">About CommitRank & Data Accuracy</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-sm text-neutral-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm mb-1">
              <Cpu className="w-4 h-4" /> Live Data Pipeline
            </div>
            <p className="text-xs text-neutral-400">
              Users and classmate accounts are discovered directly from GitHub following lists using the official GitHub GraphQL API.
              All statistics, contribution calendars, and repository stars are authentic and fetched live.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm mb-1">
              <ShieldAlert className="w-4 h-4" /> GitHub API Limitations & Caveats
            </div>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-4 mt-2">
              <li>
                <strong>Public Contributions:</strong> Includes commits, pull requests, and issues across public repositories in the last 365 days. Private contributions are only visible if the user made them public in their profile settings.
              </li>
              <li>
                <strong>Stars & Forks:</strong> Calculated across non-forked public repositories owned by the developer.
              </li>
              <li>
                <strong>Recent Velocity:</strong> Aggregated from daily timestamps in the contribution calendar for the last 7 and 30 days.
              </li>
              <li>
                <strong>Not Total Lifetime Commits:</strong> GitHub does not expose an instant single API metric for every commit across an entire account lifetime; public calendar contributions represent the official reliable standard.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40">
            <div className="flex items-center gap-2 font-semibold text-blue-400 text-sm mb-1">
              <Sparkles className="w-4 h-4" /> Scoring Formula
            </div>
            <p className="text-xs text-neutral-400">
              <code className="text-blue-300 font-mono">Score = (Contribs × Wc) + (Stars × Ws) + (Forks × Wf) + (Followers × Wfl) + (Velocity × Wv) + (Repos × Wr)</code>
            </p>
            <p className="text-[11px] text-neutral-500 mt-2">
              Weights can be fine-tuned anytime using the Weights button in the dashboard header.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-5 mt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
