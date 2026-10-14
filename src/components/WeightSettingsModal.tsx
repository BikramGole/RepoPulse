"use client";

import React, { useEffect, useId, useRef } from "react";
import { RankingWeights, DEFAULT_WEIGHTS } from "@/types";
import { Sliders, RotateCcw, X } from "lucide-react";

interface WeightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: RankingWeights;
  onUpdateWeights: (newWeights: RankingWeights) => void;
}

export function WeightSettingsModal({
  isOpen,
  onClose,
  weights,
  onUpdateWeights,
}: WeightSettingsModalProps) {
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

  const handleChange = (key: keyof RankingWeights, value: number) => {
    onUpdateWeights({
      ...weights,
      [key]: value,
    });
  };

  const handleReset = () => {
    onUpdateWeights(DEFAULT_WEIGHTS);
  };

  const sliders: Array<{ key: keyof RankingWeights; label: string; desc: string; max: number; step: number }> = [
    { key: "contributions", label: "Contributions / Commits", desc: "Public contribution calendar activities", max: 3, step: 0.1 },
    { key: "stars", label: "Stars Received", desc: "Total stars accumulated across original public repos", max: 5, step: 0.1 },
    { key: "forks", label: "Forks Received", desc: "Total forks of public original repositories", max: 3, step: 0.1 },
    { key: "followers", label: "Followers Count", desc: "GitHub audience size", max: 2, step: 0.1 },
    { key: "recentActivity", label: "Recent Activity Velocity", desc: "Multiplier on 7-day and 30-day active commits", max: 3, step: 0.1 },
    { key: "repos", label: "Public Repositories", desc: "Quantity of public open source repositories", max: 1, step: 0.05 },
  ];

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
        className="relative w-full max-w-lg p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h3 id={titleId} className="text-lg font-bold text-white">Ranking Formula Weights</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close weights dialog"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mt-3 mb-6">
          Tailor how the leaderboard scores your peers. Modifying weights re-calculates overall scores and ranks instantly.
        </p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {sliders.map(({ key, label, desc, max, step }) => (
            <div key={key} className="space-y-1.5 p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/60">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <label htmlFor={`weight-${key}`} className="font-semibold text-neutral-200">{label}</label>
                  <p className="text-[11px] text-neutral-500">{desc}</p>
                </div>
                <output htmlFor={`weight-${key}`} className="font-mono text-sm font-bold text-blue-400 ml-4" aria-live="polite">
                  {weights[key].toFixed(2)}x
                </output>
              </div>
              <input
                id={`weight-${key}`}
                type="range"
                min="0"
                max={max}
                step={step}
                value={weights[key]}
                aria-label={`${label} weight`}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
