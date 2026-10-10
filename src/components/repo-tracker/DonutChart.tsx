"use client";

import React, { useState } from "react";
import { AgeBucket } from "@/types/repoTracker";

interface DonutChartProps {
  title: string;
  buckets: AgeBucket[];
  height?: number;
}

export function DonutChart({ title, buckets, height = 210 }: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const totalCount = buckets.reduce((acc, b) => acc + b.count, 0);

  // SVG dimensions
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  // Active slice display
  const activeBucket = buckets.find((b) => b.key === hoveredKey);

  return (
    <div className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-300 tracking-tight">{title}</span>
        <span className="text-[11px] font-mono text-neutral-400">
          Open: <strong className="text-white font-semibold">{totalCount}</strong>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 my-auto">
        {/* Donut SVG */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              strokeOpacity={0.4}
            />

            {totalCount > 0 ? (
              buckets.map((b) => {
                if (b.count === 0) return null;
                const ratio = b.count / totalCount;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += ratio * circumference;
                const isHovered = hoveredKey === b.key;

                return (
                  <circle
                    key={b.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={b.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-200 cursor-pointer origin-center"
                    onMouseEnter={() => setHoveredKey(b.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })
            ) : (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#334155"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} 0`}
                opacity={0.3}
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeBucket ? (
              <>
                <span className="text-[10px] uppercase font-mono text-neutral-400">
                  {activeBucket.label}
                </span>
                <span className="text-base font-bold text-white font-mono leading-none mt-0.5">
                  {activeBucket.count}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {Math.round((activeBucket.count / (totalCount || 1)) * 100)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase font-mono text-neutral-400">
                  {totalCount > 0 ? "Issues" : "None"}
                </span>
                <span className="text-base font-bold text-white font-mono leading-none mt-0.5">
                  {totalCount}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-[100px] text-[11px] font-mono">
          {buckets.map((b) => {
            const isHovered = hoveredKey === b.key;
            return (
              <div
                key={b.key}
                onMouseEnter={() => setHoveredKey(b.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between gap-2 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  isHovered ? "bg-white/[0.08] text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span>{b.label}</span>
                </div>
                <span className="font-semibold text-neutral-300">{b.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
