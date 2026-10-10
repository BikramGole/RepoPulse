"use client";

import React from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

interface ZoomControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isZoomed: boolean;
  zoom: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomIn,
  zoomOut,
  resetZoom,
  canZoomIn,
  canZoomOut,
  isZoomed,
  zoom,
}) => {
  return (
    <div className="flex flex-col w-full select-none">
      <button
        type="button"
        onClick={zoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
        className="p-2.5 flex items-center justify-center hover:bg-white/[0.08] transition-colors focus:outline-none disabled:opacity-40"
      >
        <Plus className="h-4 w-4 text-neutral-300 hover:text-white transition-colors" />
      </button>

      <div className="h-px w-full bg-white/[0.08]" />

      <button
        type="button"
        onClick={zoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
        className="p-2.5 flex items-center justify-center hover:bg-white/[0.08] transition-colors focus:outline-none disabled:opacity-40"
      >
        <Minus className="h-4 w-4 text-neutral-300 hover:text-white transition-colors" />
      </button>

      {isZoomed && (
        <>
          <div className="h-px w-full bg-white/[0.08]" />
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="px-2 py-1.5 flex flex-col items-center gap-0.5 hover:bg-white/[0.08] transition-colors focus:outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-400 hover:text-white transition-colors" />
            <span className="text-[9px] font-mono font-medium text-neutral-400">
              {Math.round(zoom * 100)}%
            </span>
          </button>
        </>
      )}
    </div>
  );
};
