"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { RankedUser } from "@/types";
import { MapMode, WorldGeoJson } from "@/types/globe";
import { useGlobePaths } from "@/hooks/useGlobePaths";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import { useMapZoom } from "@/hooks/useMapZoom";
import { ZoomControls } from "@/components/ZoomControls";
import { MAP_BASE_STYLING, COUNTRY_ACCENTS, createHeatScale } from "@/lib/countryColors";
import { COUNTRIES_DATABASE } from "@/lib/geo";
import {
  Globe,
  Camera,
  MapPin,
  ExternalLink,
  Users,
  Compass,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

interface GlobeMapProps {
  users: RankedUser[];
}

export function GlobeMap({ users }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 480,
  });

  const [mapMode, setMapMode] = useState<MapMode>("GLOBE");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>("NP");
  const [geoJson, setGeoJson] = useState<WorldGeoJson | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 800;
        const h = Math.min(Math.max(w * 0.58, 420), 560);
        setDimensions({ width: w, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch GeoJSON
  useEffect(() => {
    let isMounted = true;

    async function loadGeoJson() {
      try {
        // Try local asset first
        let res = await fetch("/ne_110m_admin_0_countries.geojson");
        if (!res.ok) {
          // Fallback to CDN
          res = await fetch(
            "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson"
          );
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setGeoJson(data);
            setIsLoadingGeo(false);
          }
        }
      } catch (err) {
        console.error("Failed to load map geojson:", err);
        if (isMounted) setIsLoadingGeo(false);
      }
    }

    loadGeoJson();
    return () => {
      isMounted = false;
    };
  }, []);

  // Aggregate users by country
  const profilesByCountry = useMemo(() => {
    const map = new Map<string, RankedUser[]>();
    for (const u of users) {
      const code = u.country?.code || "NP";
      const existing = map.get(code) || [];
      existing.push(u);
      map.set(code, existing);
    }
    return map;
  }, [users]);

  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    profilesByCountry.forEach((list, code) => {
      counts.set(code, list.length);
    });
    return counts;
  }, [profilesByCountry]);

  const heatScale = useMemo(() => createHeatScale(countryCounts), [countryCounts]);

  // Zoom hook
  const nudgePanRef = useRef<
    ((anchorX: number, anchorY: number, scaleRatio: number, atZoom: number) => void) | null
  >(null);

  const {
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn,
    canZoomOut,
    isZoomed,
    handleWheel,
  } = useMapZoom(1, (prevZoom, nextZoom, [ax, ay]) => {
    const scaleRatio = nextZoom / prevZoom;
    nudgePanRef.current?.(
      ax - dimensions.width / 2,
      ay - dimensions.height / 2,
      scaleRatio,
      nextZoom
    );
  });

  // Rotation and dragging
  const { rotation, pan, isDragging, didDrag, dragHandlers, nudgePan } = useGlobeRotation(
    selectedCountryCode,
    geoJson,
    zoom,
    mapMode,
    dimensions.width,
    dimensions.height,
    true // autoRotate enabled
  );

  useEffect(() => {
    nudgePanRef.current = nudgePan;
  }, [nudgePan]);

  // D3 map paths generator
  const { mapPaths, sphere2D, sphere3D, progress } = useGlobePaths(
    geoJson,
    dimensions.width,
    dimensions.height,
    rotation,
    pan,
    mapMode,
    zoom
  );

  // Selected country statistics
  const selectedStats = useMemo(() => {
    if (!selectedCountryCode) return null;
    const countryProfiles = profilesByCountry.get(selectedCountryCode) || [];
    const info = COUNTRIES_DATABASE[selectedCountryCode] || {
      code: selectedCountryCode,
      name: selectedCountryCode,
      flag: "🌐",
      lat: 0,
      lng: 0,
    };
    return {
      code: selectedCountryCode,
      name: info.name,
      flag: info.flag,
      count: countryProfiles.length,
      users: countryProfiles,
      percent: Math.round((countryProfiles.length / (users.length || 1)) * 100),
    };
  }, [selectedCountryCode, profilesByCountry, users.length]);

  // Snapshot handler
  const handleSnapshot = () => {
    setIsExporting(true);
    const svgElem = containerRef.current?.querySelector("svg");
    if (!svgElem) {
      setIsExporting(false);
      return;
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgElem);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `commitrank-gitcharta-map-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Banner / Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0b0f19]/90 border border-white/[0.08] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              GitCharta 3D Globe Engine
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Interactive Global Classmate Network
          </h3>
          <p className="text-xs text-neutral-400">
            Spin and explore classmate geolocations across {profilesByCountry.size} active regions.
            Click any country to center orbit.
          </p>
        </div>

        {/* View Mode & Camera actions */}
        <div className="flex items-center gap-2">
          {/* 3D vs 2D selector */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMapMode("GLOBE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapMode === "GLOBE"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              3D Globe
            </button>
            <button
              type="button"
              onClick={() => setMapMode("SPHERE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapMode === "SPHERE"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              2D Planar
            </button>
          </div>

          {/* Snapshot button */}
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={isExporting}
            title="Download SVG Snapshot"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <Camera className={`w-4 h-4 ${isExporting ? "animate-pulse text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        className="relative w-full rounded-3xl bg-[#030611] border border-white/[0.08] shadow-2xl overflow-hidden select-none"
        style={{ minHeight: "420px" }}
      >
        {/* Subtle celestial stars background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 left-4 z-20 bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <ZoomControls
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            resetZoom={resetZoom}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            isZoomed={isZoomed}
            zoom={zoom}
          />
        </div>

        {/* Loading Spinner */}
        {isLoadingGeo && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#030611]/80 backdrop-blur-sm">
            <Globe className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-neutral-400 animate-pulse">
              Synthesizing Global Cartography Coordinates…
            </span>
          </div>
        )}

        {/* SVG Canvas for D3 3D Globe / 2D Map */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onWheel={handleWheel}
          className={`w-full h-full block ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          {...dragHandlers}
        >
          <defs>
            {/* Glowing filter for highlighted countries */}
            <filter id="globe-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feFlood floodColor="#06b6d4" floodOpacity="0.6" result="flood" />
              <feComposite in="flood" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial gradient for deep ocean space */}
            <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#0a1224" />
              <stop offset="100%" stopColor="#040711" />
            </radialGradient>
          </defs>

          {/* Globe Atmosphere / Water Spheres */}
          <g>
            {sphere2D && (
              <path
                d={sphere2D}
                fill="url(#ocean-gradient)"
                opacity={1 - progress}
                stroke="#1e293b"
                strokeWidth={0.5}
              />
            )}
            {sphere3D && (
              <path
                d={sphere3D}
                fill="url(#ocean-gradient)"
                opacity={progress}
                stroke="#38bdf8"
                strokeWidth={0.75}
                strokeOpacity={0.4}
              />
            )}
          </g>

          {/* Countries */}
          <g>
            {mapPaths.map((country) => {
              const count = countryCounts.get(country.id) || 0;
              const hasClassmates = count > 0;
              const isSelected = selectedCountryCode === country.id;

              if (!country.svgPath) return null;

              // Color resolution
              let fillColor = MAP_BASE_STYLING.defaultFill;
              if (hasClassmates) {
                const accent = COUNTRY_ACCENTS[country.id] || "#3b82f6";
                const heatOpacity = heatScale(count);
                fillColor = isSelected ? "#38bdf8" : accent;
              }

              return (
                <path
                  key={`${country.id}-${country.name}`}
                  d={country.svgPath}
                  filter={isSelected ? "url(#globe-glow)" : undefined}
                  fill={fillColor}
                  fillOpacity={
                    hasClassmates
                      ? isSelected
                        ? 0.95
                        : heatScale(count)
                      : 0.35
                  }
                  stroke={isSelected ? "#ffffff" : hasClassmates ? "#38bdf8" : "#334155"}
                  strokeWidth={isSelected ? 1.5 : hasClassmates ? 0.75 : 0.25}
                  style={{
                    opacity: country.opacity,
                    pointerEvents: country.opacity < 0.15 ? "none" : "auto",
                  }}
                  className="transition-[fill,stroke,opacity] duration-200 cursor-pointer hover:stroke-white hover:stroke-[1.5px] hover:fill-opacity-100"
                  onClick={(e) => {
                    if (didDrag()) {
                      e.stopPropagation();
                      return;
                    }
                    setSelectedCountryCode(isSelected ? null : country.id);
                  }}
                >
                  <title>
                    {country.name} {count > 0 ? `(${count} classmates)` : ""}
                  </title>
                </path>
              );
            })}
          </g>
        </svg>

        {/* Selected Country Drawer / Card */}
        {selectedStats && (
          <div className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-neutral-950/90 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedStats.flag}</span>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    {selectedStats.name}
                    {selectedStats.code === "NP" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Home Hub
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-neutral-400">
                    {selectedStats.count} {selectedStats.count === 1 ? "classmate" : "classmates"} (
                    {selectedStats.percent}% of cohort)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCountryCode(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of classmates in this country */}
            <div className="max-h-56 overflow-y-auto p-2 divide-y divide-white/[0.04]">
              {selectedStats.users.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No active classmates registered in {selectedStats.name}.
                </div>
              ) : (
                selectedStats.users.map((student) => (
                  <Link
                    key={student.login}
                    href={`/users/${student.login}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-cyan-400 transition-colors">
                        <Image
                          src={student.avatarUrl}
                          alt={student.login}
                          fill
                          unoptimized
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {student.name || student.login}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-400 truncate">
                          @{student.login}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-neutral-300 block">
                          Rank #{student.rank}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {student.totalContributions.toLocaleString()} commits
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Country quick-selector badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 mr-1">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          Active Regions:
        </span>
        {Array.from(profilesByCountry.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .map(([code, list]) => {
            const isSelected = selectedCountryCode === code;
            const info = COUNTRIES_DATABASE[code] || {
              code,
              name: code,
              flag: "🌐",
            };

            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCountryCode(isSelected ? null : code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-lg shadow-cyan-500/10 scale-105"
                    : "bg-white/[0.03] text-neutral-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>{info.flag}</span>
                <span>{info.name}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white">
                  {list.length}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
