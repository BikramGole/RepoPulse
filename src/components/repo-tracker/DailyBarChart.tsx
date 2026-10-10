"use client";

import React, { useState } from "react";
import { DayDataPoint } from "@/types/repoTracker";

interface DailyBarChartProps {
  title: string;
  data: DayDataPoint[];
  barColor?: string;
  hoverColor?: string;
  height?: number;
  emptyLabel?: string;
}

export function DailyBarChart({
  title,
  data,
  barColor = "#38bdf8",
  hoverColor = "#67e8f9",
  height = 190,
  emptyLabel = "No activity in the last 30 days",
}: DailyBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  // Y-axis steps: 0, max/2, max
  const yTicks = [
    maxCount,
    Math.round((maxCount * 2) / 3 * 10) / 10,
    Math.round((maxCount / 3) * 10) / 10,
    0,
  ];

  const chartPaddingTop = 20;
  const chartPaddingBottom = 30;
  const chartPaddingLeft = 32;
  const chartPaddingRight = 12;

  const chartWidth = 600;
  const chartHeight = height;
  const innerHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
  const innerWidth = chartWidth - chartPaddingLeft - chartPaddingRight;

  const barSlotWidth = innerWidth / (data.length || 1);
  const barWidth = Math.max(3, barSlotWidth * 0.55);

  const totalCount = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
      {/* Chart Title Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-neutral-300 tracking-tight">{title}</span>
        <span className="text-[11px] font-mono text-neutral-400">
          Total: <strong className="text-white font-semibold">{totalCount}</strong>
        </span>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ minHeight: `${height}px` }}
        >
          {/* Horizontal gridlines */}
          {yTicks.map((val, idx) => {
            const y = chartPaddingTop + (idx / (yTicks.length - 1)) * innerHeight;
            return (
              <g key={`grid-${idx}`}>
                <line
                  x1={chartPaddingLeft}
                  y1={y}
                  x2={chartWidth - chartPaddingRight}
                  y2={y}
                  stroke="#ffffff"
                  strokeOpacity={idx === yTicks.length - 1 ? 0.12 : 0.05}
                  strokeDasharray={idx === yTicks.length - 1 ? "none" : "3,3"}
                  strokeWidth={0.8}
                />
                <text
                  x={chartPaddingLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {val % 1 === 0 ? val : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const barH = (item.count / maxCount) * innerHeight;
            const x = chartPaddingLeft + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const y = chartPaddingTop + innerHeight - barH;
            const isHovered = hoveredIndex === idx;

            // Show label every ~3 days or first/last
            const showLabel = idx % 3 === 0 || idx === data.length - 1;

            return (
              <g
                key={`bar-${item.date}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover target hitbox */}
                <rect
                  x={chartPaddingLeft + idx * barSlotWidth}
                  y={chartPaddingTop}
                  width={barSlotWidth}
                  height={innerHeight + 20}
                  fill="transparent"
                />

                {/* Highlight column on hover */}
                {isHovered && (
                  <rect
                    x={chartPaddingLeft + idx * barSlotWidth}
                    y={chartPaddingTop}
                    width={barSlotWidth}
                    height={innerHeight}
                    fill="#38bdf8"
                    fillOpacity={0.06}
                    rx={2}
                  />
                )}

                {/* Actual Bar */}
                <rect
                  x={x}
                  y={item.count > 0 ? y : chartPaddingTop + innerHeight - 1}
                  width={barWidth}
                  height={item.count > 0 ? barH : 1}
                  fill={isHovered ? hoverColor : barColor}
                  fillOpacity={item.count > 0 ? (isHovered ? 1 : 0.85) : 0.25}
                  rx={item.count > 0 ? 2 : 0}
                  className="transition-all duration-150"
                />

                {/* X Axis Date Label */}
                {showLabel && (
                  <text
                    x={chartPaddingLeft + idx * barSlotWidth + barSlotWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill={isHovered ? "#38bdf8" : "#71717a"}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {item.dayLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Tooltip */}
          {hoveredIndex !== null && data[hoveredIndex] && (
            <g
              transform={`translate(${Math.min(
                Math.max(
                  chartPaddingLeft + hoveredIndex * barSlotWidth + barSlotWidth / 2,
                  60
                ),
                chartWidth - 60
              )}, ${Math.max(
                chartPaddingTop +
                  innerHeight -
                  (data[hoveredIndex].count / maxCount) * innerHeight -
                  28,
                15
              )})`}
              pointerEvents="none"
            >
              <rect
                x="-42"
                y="-14"
                width="84"
                height="22"
                rx="6"
                fill="#030611"
                stroke="#38bdf8"
                strokeWidth="1"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fill="#f4f4f5"
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {data[hoveredIndex].count} on {data[hoveredIndex].date.slice(5)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {totalCount === 0 && (
        <div className="absolute inset-0 top-10 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <span className="text-xs font-mono text-neutral-400">{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}
