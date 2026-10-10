import { useCallback, useEffect, useRef, useState } from "react";
import type { WorldGeoJson, MapMode } from "@/types/globe";
import { useMapGestures } from "@/hooks/useMapGestures";
import { useGlobeAnimation } from "@/hooks/useGlobeAnimation";

const BASE_DRAG_SENSITIVITY = 0.4;

export function useGlobeRotation(
  selectedCountry: string | null | undefined,
  geoJson: WorldGeoJson | null,
  zoom: number,
  mapMode: MapMode,
  width: number,
  height: number,
  autoRotate: boolean = true
) {
  const isGlobe = mapMode === "GLOBE";

  const [rotation, setRotation] = useState<[number, number, number]>([0, -15, 0]);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const autoRotateTimerRef = useRef<number | null>(null);

  if (zoom <= 1 && (pan[0] !== 0 || pan[1] !== 0)) {
    setPan([0, 0]);
  }

  const effectivePan: [number, number] = zoom <= 1 ? [0, 0] : pan;

  const { cancelAnimation } = useGlobeAnimation(
    selectedCountry,
    geoJson,
    isGlobe,
    rotation,
    setRotation
  );

  const handleDrag = useCallback(
    (dx: number, dy: number) => {
      if (isGlobe) {
        const sensitivity = BASE_DRAG_SENSITIVITY / zoom;
        setRotation(([r0, r1]) => [
          r0 + dx * sensitivity,
          Math.max(-90, Math.min(90, r1 - dy * sensitivity)),
          0,
        ]);
      } else {
        const maxX = Math.max(0, (width * zoom - width) / 2);
        const maxY = Math.max(0, (height * zoom - height) / 2);

        setPan(([p0, p1]) => [
          Math.max(-maxX, Math.min(maxX, p0 + dx)),
          Math.max(-maxY, Math.min(maxY, p1 + dy)),
        ]);
      }
    },
    [isGlobe, zoom, width, height]
  );

  const { isDragging, didDrag, gestureHandlers } = useMapGestures({
    enabled: isGlobe || zoom > 1,
    onDragStart: cancelAnimation,
    onDrag: handleDrag,
  });

  // Slow ambient rotation when idle, globe mode, and not dragging or focused on country
  useEffect(() => {
    if (!autoRotate || !isGlobe || isDragging || selectedCountry) {
      if (autoRotateTimerRef.current) cancelAnimationFrame(autoRotateTimerRef.current);
      return;
    }

    let lastTime = performance.now();
    const spin = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // Spin ~0.015 degrees per millisecond
      setRotation(([r0, r1]) => [(r0 + delta * 0.015) % 360, r1, 0]);
      autoRotateTimerRef.current = requestAnimationFrame(spin);
    };

    autoRotateTimerRef.current = requestAnimationFrame(spin);
    return () => {
      if (autoRotateTimerRef.current) cancelAnimationFrame(autoRotateTimerRef.current);
    };
  }, [autoRotate, isGlobe, isDragging, selectedCountry]);

  const nudgePan = useCallback(
    (anchorX: number, anchorY: number, scaleRatio: number, atZoom: number) => {
      if (isGlobe) return;
      const maxX = Math.max(0, (width * atZoom - width) / 2);
      const maxY = Math.max(0, (height * atZoom - height) / 2);
      const k = 1 - scaleRatio;

      setPan(([p0, p1]) => [
        Math.max(-maxX, Math.min(maxX, p0 + k * (anchorX - p0))),
        Math.max(-maxY, Math.min(maxY, p1 + k * (anchorY - p1))),
      ]);
    },
    [isGlobe, width, height]
  );

  return {
    rotation,
    setRotation,
    pan: effectivePan,
    isDragging,
    didDrag,
    dragHandlers: gestureHandlers,
    nudgePan,
  };
}
