"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ContributorStat } from "@/types/repoTracker";

interface ContributorBarChartProps {
  contributors: ContributorStat[];
  height?: number;
}

export function ContributorBarChart({
  contributors,
  height = 200,
}: ContributorBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out bots for the main chart
  const activeContributors = contributors.filter((c) => !c.isBot);
  const totalContributions = activeContributors.reduce((acc, c) => acc + c.contributions, 0);
  const maxVal = Math.max(1, ...activeContributors.map((c) => c.contributions));

  const yTicks = [
    maxVal,
    Math.round((maxVal * 3) / 4),
    Math.round(maxVal / 2),
    Math.round(maxVal / 4),
    0,
  ];

  const svgWidth = 800;
  const svgHeight = height;
  const padTop = 20;
  const padBottom = 40;
  const padLeft = 40;
  const padRight = 20;

  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const count = Math.max(activeContributors.length, 1);
  const slotW = innerW / count;
  const barW = Math.min(32, Math.max(8, slotW * 0.45));

  return (
    <div className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-neutral-300 tracking-tight">
          Contributions (excl. bots)
        </span>
        <span className="text-[11px] font-mono text-neutral-400">
          Contributors: <strong className="text-white font-semibold">{activeContributors.length}</strong>{" "}
          • Total Commits: <strong className="text-white font-semibold">{totalContributions}</strong>
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none overflow-visible"
        >
          {/* Y-axis Gridlines */}
          {yTicks.map((val, idx) => {
            const y = padTop + (idx / (yTicks.length - 1)) * innerH;
            return (
              <g key={`contrib-grid-${idx}`}>
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
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars & Avatars */}
          {activeContributors.map((c, idx) => {
            const barH = (c.contributions / maxVal) * innerH;
            const x = padLeft + idx * slotW + (slotW - barW) / 2;
            const y = padTop + innerH - barH;
            const isHovered = hoveredIndex === idx;

            const avatarSize = 20;
            const avatarX = padLeft + idx * slotW + (slotW - avatarSize) / 2;
            const avatarY = svgHeight - padBottom + 8;

            return (
              <g
                key={c.login}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hitbox */}
                <rect
                  x={padLeft + idx * slotW}
                  y={padTop}
                  width={slotW}
                  height={innerH + padBottom}
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
                  y={y}
                  width={barW}
                  height={barH}
                  fill={isHovered ? "#67e8f9" : "#38bdf8"}
                  fillOpacity={isHovered ? 1 : 0.85}
                  rx={2}
                  className="transition-all duration-150"
                />

                {/* Avatar image in foreignObject */}
                <foreignObject
                  x={avatarX}
                  y={avatarY}
                  width={avatarSize}
                  height={avatarSize}
                  className="overflow-visible"
                >
                  <a
                    href={c.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative w-5 h-5 rounded-full overflow-hidden border border-white/20 hover:border-cyan-400 transition-colors"
                    title={`@${c.login}: ${c.contributions} contributions`}
                  >
                    <Image
                      src={c.avatarUrl}
                      alt={c.login}
                      fill
                      unoptimized
                      sizes="20px"
                      className="object-cover"
                    />
                  </a>
                </foreignObject>
              </g>
            );
          })}

          {/* Hover Tooltip */}
          {hoveredIndex !== null && activeContributors[hoveredIndex] && (
            <g
              transform={`translate(${Math.min(
                Math.max(
                  padLeft + hoveredIndex * slotW + slotW / 2,
                  60
                ),
                svgWidth - 60
              )}, ${Math.max(
                padTop +
                  innerH -
                  (activeContributors[hoveredIndex].contributions / maxVal) * innerH -
                  28,
                15
              )})`}
              pointerEvents="none"
            >
              <rect
                x="-50"
                y="-14"
                width="100"
                height="22"
                rx="6"
                fill="#030611"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                @{activeContributors[hoveredIndex].login}:{" "}
                {activeContributors[hoveredIndex].contributions}
              </text>
            </g>
          )}
        </svg>
      </div>

      {activeContributors.length === 0 && (
        <div className="text-center py-6 text-xs font-mono text-neutral-400">
          No contributor statistics available.
        </div>
      )}
    </div>
  );
}
