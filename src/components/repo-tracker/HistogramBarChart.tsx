"use client";

import React, { useState } from "react";
import { LifetimeBucket } from "@/types/repoTracker";

interface HistogramBarChartProps {
  title: string;
  buckets: LifetimeBucket[];
  height?: number;
}

export function HistogramBarChart({
  title,
  buckets,
  height = 210,
}: HistogramBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalCount = buckets.reduce((acc, b) => acc + b.count, 0);
  const maxVal = Math.max(1, ...buckets.map((b) => b.count));

  const yTicks = [100, 80, 60, 40, 20, 0];

  const svgWidth = 320;
  const svgHeight = 150;
  const padTop = 15;
  const padBottom = 25;
  const padLeft = 30;
  const padRight = 10;

  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const slotW = innerW / (buckets.length || 1);
  const barW = Math.max(8, slotW * 0.6);

  return (
    <div className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-300 tracking-tight">{title}</span>
        <span className="text-[11px] font-mono text-neutral-400">
          Closed: <strong className="text-white font-semibold">{totalCount}</strong>
        </span>
      </div>

      <div className="relative w-full my-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none overflow-visible"
        >
          {/* Grid lines */}
          {yTicks.map((tickVal, idx) => {
            const y = padTop + (idx / (yTicks.length - 1)) * innerH;
            return (
              <g key={`hist-grid-${idx}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#ffffff"
                  strokeOpacity={idx === yTicks.length - 1 ? 0.12 : 0.05}
                  strokeDasharray={idx === yTicks.length - 1 ? "none" : "2,2"}
                  strokeWidth={0.8}
                />
                <text
                  x={padLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {/* Histogram Bars */}
          {buckets.map((b, idx) => {
            // Percent relative to totalCount or relative to max
            const barH = totalCount > 0 ? (b.count / maxVal) * innerH : 0;
            const x = padLeft + idx * slotW + (slotW - barW) / 2;
            const y = padTop + innerH - barH;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={b.key}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hitbox */}
                <rect
                  x={padLeft + idx * slotW}
                  y={padTop}
                  width={slotW}
                  height={innerH + 18}
                  fill="transparent"
                />

                {/* Column highlight */}
                {isHovered && (
                  <rect
                    x={padLeft + idx * slotW}
                    y={padTop}
                    width={slotW}
                    height={innerH}
                    fill="#38bdf8"
                    fillOpacity={0.06}
                  />
                )}

                {/* Bar */}
                <rect
                  x={x}
                  y={b.count > 0 ? y : padTop + innerH - 1}
                  width={barW}
                  height={b.count > 0 ? barH : 1}
                  fill={isHovered ? "#67e8f9" : "#38bdf8"}
                  fillOpacity={b.count > 0 ? 0.8 : 0.2}
                  rx={2}
                  className="transition-all duration-150"
                />

                {/* X-axis label */}
                <text
                  x={padLeft + idx * slotW + slotW / 2}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fill={isHovered ? "#38bdf8" : "#71717a"}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {b.label}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredIndex !== null && buckets[hoveredIndex] && (
            <g
              transform={`translate(${
                padLeft + hoveredIndex * slotW + slotW / 2
              }, ${Math.max(
                padTop + innerH - (buckets[hoveredIndex].count / maxVal) * innerH - 24,
                10
              )})`}
              pointerEvents="none"
            >
              <rect
                x="-36"
                y="-12"
                width="72"
                height="18"
                rx="4"
                fill="#030611"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {buckets[hoveredIndex].count} ({buckets[hoveredIndex].label})
              </text>
            </g>
          )}
        </svg>
      </div>

      {totalCount === 0 && (
        <div className="text-center py-2 text-[11px] font-mono text-neutral-400">
          No closed issue lifetime data available
        </div>
      )}
    </div>
  );
}
