"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserAudienceData, AudienceProfile, AudienceType } from "@/lib/gitcharta/types";
import { MapMode, WorldGeoJson } from "@/types/globe";
import { useGlobePaths } from "@/hooks/useGlobePaths";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import { useMapZoom } from "@/hooks/useMapZoom";
import { ZoomControls } from "@/components/ZoomControls";
import { MAP_BASE_STYLING, createHeatScale } from "@/lib/countryColors";
import { POPULATED_COUNTRY_COLORS } from "@/lib/gitcharta/countryColors";
import { getRegionName, getCountryFlag, UNKNOWN_REGION } from "@/lib/gitcharta/region";
import {
  Globe,
  Map as MapIcon,
  Camera,
  MapPin,
  ExternalLink,
  Users,
  Compass,
  Search,
  X,
  UserCheck,
  UserPlus,
  Radio,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface UserAudienceMapProps {
  initialAudience: UserAudienceData;
  currentUserLogin: string;
  currentUserLocation?: string | null;
}

// Module-level GeoJSON cache to avoid redundant network fetching across renders
let cachedWorldGeoJson: WorldGeoJson | null = null;

export function UserAudienceMap({
  initialAudience,
  currentUserLogin,
  currentUserLocation,
}: UserAudienceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 480,
  });

  const [audienceData, setAudienceData] = useState<UserAudienceData>(initialAudience);
  const [activeUsername, setActiveUsername] = useState(currentUserLogin);
  const [activeTab, setActiveTab] = useState<AudienceType>("followers");
  const [mapMode, setMapMode] = useState<MapMode>("GLOBE");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [geoJson, setGeoJson] = useState<WorldGeoJson | null>(cachedWorldGeoJson);
  const [isLoadingGeo, setIsLoadingGeo] = useState(!cachedWorldGeoJson);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Turn off auto-rotation by default as requested: only rotate when country is selected
  const [autoRotate, setAutoRotate] = useState(false);

  // GitHub user network search
  const [lookupInput, setLookupInput] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Pagination for displayed profile list to prevent DOM lag on 100+ accounts
  const [visibleCount, setVisibleCount] = useState(30);

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 800;
        const h = Math.min(Math.max(w * 0.58, 440), 580);
        setDimensions({ width: w, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch GeoJSON (with in-memory caching)
  useEffect(() => {
    if (cachedWorldGeoJson) {
      setGeoJson(cachedWorldGeoJson);
      setIsLoadingGeo(false);
      return;
    }

    let isMounted = true;

    async function loadGeoJson() {
      try {
        let res = await fetch("/ne_110m_admin_0_countries.geojson");
        if (!res.ok) {
          res = await fetch(
            "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson"
          );
        }
        if (res.ok) {
          const data = await res.json();
          cachedWorldGeoJson = data;
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

  // Handle GitHub user search / lookup
  const handleUserLookup = async (e?: React.FormEvent, usernameToSearch?: string) => {
    if (e) e.preventDefault();
    const targetUser = (usernameToSearch || lookupInput).trim();
    if (!targetUser) return;

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/audience/${encodeURIComponent(targetUser)}`);
      if (!res.ok) {
        throw new Error(`Failed to load network for @${targetUser}`);
      }
      const data: UserAudienceData = await res.json();
      setAudienceData(data);
      setActiveUsername(data.username || targetUser);
      setSelectedCountryCode(null);
      setSearchQuery("");
      setVisibleCount(30);
      setLookupInput("");
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Error analyzing network");
    } finally {
      setIsLookingUp(false);
    }
  };

  // Active profile list based on tab
  const activeProfiles: AudienceProfile[] = useMemo(() => {
    if (activeTab === "following") return audienceData.following;
    if (activeTab === "mutuals") return audienceData.mutuals;
    return audienceData.followers;
  }, [activeTab, audienceData]);

  // Aggregate active profiles by country
  const profilesByCountry = useMemo(() => {
    const map = new Map<string, AudienceProfile[]>();
    for (const p of activeProfiles) {
      const code = p.country || UNKNOWN_REGION;
      const existing = map.get(code) || [];
      existing.push(p);
      map.set(code, existing);
    }
    return map;
  }, [activeProfiles]);

  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    profilesByCountry.forEach((list, code) => {
      if (code !== UNKNOWN_REGION) {
        counts.set(code, list.length);
      }
    });
    return counts;
  }, [profilesByCountry]);

  const heatScale = useMemo(() => createHeatScale(countryCounts), [countryCounts]);

  // Pre-calculate country style map to fix rotation lag (prevents expensive math inside SVG render loop)
  const countryStyleMap = useMemo(() => {
    const map = new Map<
      string,
      {
        fill: string;
        fillOpacity: number;
        stroke: string;
        strokeWidth: number;
        isSelected: boolean;
        count: number;
      }
    >();

    for (const [code, list] of profilesByCountry.entries()) {
      if (code === UNKNOWN_REGION) continue;
      const isSelected = selectedCountryCode === code;
      const count = list.length;
      const color = (POPULATED_COUNTRY_COLORS as Record<string, string>)[code] || "#3b82f6";
      const opacity = isSelected ? 0.95 : heatScale(count);

      map.set(code, {
        fill: isSelected ? "#38bdf8" : color,
        fillOpacity: opacity,
        stroke: isSelected ? "#ffffff" : "#38bdf8",
        strokeWidth: isSelected ? 1.5 : 0.75,
        isSelected,
        count,
      });
    }

    return map;
  }, [profilesByCountry, selectedCountryCode, heatScale]);

  const totalProfiles = activeProfiles.length;
  const unknownCount = profilesByCountry.get(UNKNOWN_REGION)?.length || 0;
  const locatedCount = totalProfiles - unknownCount;
  const locatedPercent = totalProfiles > 0 ? Math.round((locatedCount / totalProfiles) * 100) : 0;

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

  // Rotation and dragging: autoRotate is false by default, only rotates on country selection or drag
  const { rotation, pan, isDragging, didDrag, dragHandlers, nudgePan } = useGlobeRotation(
    selectedCountryCode,
    geoJson,
    zoom,
    mapMode,
    dimensions.width,
    dimensions.height,
    autoRotate
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

  // Filtered profiles for the side panel / directory
  const displayedProfiles = useMemo(() => {
    let list = activeProfiles;

    if (selectedCountryCode) {
      list = profilesByCountry.get(selectedCountryCode) || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.login.toLowerCase().includes(q) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          p.countryName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeProfiles, selectedCountryCode, profilesByCountry, searchQuery]);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [activeTab, selectedCountryCode, searchQuery]);

  const pagedProfiles = useMemo(() => {
    return displayedProfiles.slice(0, visibleCount);
  }, [displayedProfiles, visibleCount]);

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
      link.download = `${activeUsername}-gitcharta-${activeTab}-${Date.now()}.svg`;
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

  const selectedCountryName = selectedCountryCode
    ? getRegionName(selectedCountryCode)
    : null;
  const selectedCountryFlag = selectedCountryCode
    ? getCountryFlag(selectedCountryCode)
    : null;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 border-b border-white/[0.06] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              GitCharta Geographic Audience Engine
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Global Follower & Following Network</span>
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <span>@{activeUsername}</span>
              {activeUsername !== currentUserLogin && (
                <button
                  type="button"
                  onClick={() => handleUserLookup(undefined, currentUserLogin)}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title="Reset to profile owner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
            {activeUsername !== currentUserLogin && (
              <Link
                href={`/users/${activeUsername}`}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                View Full Profile
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Explore the worldwide footprint of developer connections. Click any country to filter
            profiles and fly the camera to that regional cluster.
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Map projection 3D Globe vs 2D World Map */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setMapMode("GLOBE")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mapMode === "GLOBE"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Globe</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode("SPHERE")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mapMode === "SPHERE"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D World Map</span>
            </button>
          </div>

          {/* Auto-rotate toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Pause Auto-Rotation" : "Resume Auto-Rotation"}
            className={`p-2 rounded-2xl border transition-all ${
              autoRotate
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                : "bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white"
            }`}
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* SVG Snapshot */}
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={isExporting}
            title="Download SVG Snapshot"
            className="p-2 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <Camera className={`w-4 h-4 ${isExporting ? "animate-pulse text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* GitHub Username Analysis & Lookup Area */}
      <div className="p-4 rounded-2xl bg-[#060913] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Analyze Any GitHub Developer Network
            </h4>
          </div>
          <p className="text-[11px] text-neutral-400">
            Type any GitHub username to map their followers and following globally.
          </p>
        </div>

        <form onSubmit={handleUserLookup} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
              @
            </span>
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="e.g. BikramGole, torvalds"
              className="bg-[#0b101d] border border-white/[0.1] rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400/50 w-48 md:w-56 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLookingUp || !lookupInput.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            {isLookingUp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isLookingUp ? "Mapping…" : "Map User"}</span>
          </button>
        </form>
      </div>

      {/* Quick suggestions if user wants to explore other profiles */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
        <span className="font-mono text-neutral-500">Quick explore:</span>
        {["BikramGole", "NeoXBikram", "torvalds", "shadcn"].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleUserLookup(undefined, preset)}
            disabled={isLookingUp}
            className={`px-2 py-0.5 rounded-lg border font-mono transition-all ${
              activeUsername.toLowerCase() === preset.toLowerCase()
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                : "bg-white/[0.03] text-neutral-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            @{preset}
          </button>
        ))}
      </div>

      {lookupError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {/* Audience Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-[#050812] border border-white/[0.08] rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("followers");
              setSelectedCountryCode(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "followers"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Followers</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === "followers" ? "bg-black/20 text-black" : "bg-white/10 text-neutral-300"
              }`}
            >
              {audienceData.followers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("following");
              setSelectedCountryCode(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "following"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Following</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === "following" ? "bg-white/20 text-white" : "bg-white/10 text-neutral-300"
              }`}
            >
              {audienceData.following.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("mutuals");
              setSelectedCountryCode(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "mutuals"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mutual Connections</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                activeTab === "mutuals" ? "bg-black/20 text-black" : "bg-white/10 text-neutral-300"
              }`}
            >
              {audienceData.mutuals.length}
            </span>
          </button>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 bg-white/[0.02] border border-white/[0.06] px-3.5 py-2 rounded-2xl">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            {countryCounts.size} {countryCounts.size === 1 ? "country" : "countries"}
          </span>
          <span className="text-neutral-600">•</span>
          <span>
            {locatedPercent}% mapped ({locatedCount}/{totalProfiles})
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left/Top) + Country & User Directory (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            ref={containerRef}
            className="relative w-full rounded-3xl bg-[#030611] border border-white/[0.08] shadow-2xl overflow-hidden select-none"
            style={{ minHeight: "440px" }}
          >
            {/* Celestial stars background */}
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

            {/* Active Selected Country Float Pill */}
            {selectedCountryCode && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-neutral-950/90 border border-cyan-400/40 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
                <span className="text-base">{selectedCountryFlag}</span>
                <span className="text-xs font-bold text-white">{selectedCountryName}</span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  ({profilesByCountry.get(selectedCountryCode)?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCountryCode(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
                <filter id="audience-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feFlood floodColor="#06b6d4" floodOpacity="0.7" result="flood" />
                  <feComposite in="flood" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Radial gradient for deep ocean space */}
                <radialGradient id="audience-ocean-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#0a1224" />
                  <stop offset="100%" stopColor="#040711" />
                </radialGradient>
              </defs>

              {/* Atmosphere / Water Spheres */}
              <g>
                {sphere2D && (
                  <path
                    d={sphere2D}
                    fill="url(#audience-ocean-gradient)"
                    opacity={1 - progress}
                    stroke="#1e293b"
                    strokeWidth={0.5}
                  />
                )}
                {sphere3D && (
                  <path
                    d={sphere3D}
                    fill="url(#audience-ocean-gradient)"
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
                  if (!country.svgPath) return null;

                  const style = countryStyleMap.get(country.id);
                  const isSelected = selectedCountryCode === country.id;
                  const hasProfiles = Boolean(style);

                  const fillColor = style ? style.fill : MAP_BASE_STYLING.defaultFill;
                  const fillOpacity = style ? style.fillOpacity : 0.35;
                  const strokeColor = isSelected ? "#ffffff" : hasProfiles ? "#38bdf8" : "#334155";
                  const strokeWidth = isSelected ? 1.5 : hasProfiles ? 0.75 : 0.25;

                  return (
                    <path
                      key={`${country.id}-${country.name}`}
                      d={country.svgPath}
                      filter={isSelected ? "url(#audience-glow)" : undefined}
                      fill={fillColor}
                      fillOpacity={fillOpacity}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      style={{
                        opacity: country.opacity,
                        pointerEvents: country.opacity < 0.15 ? "none" : "auto",
                      }}
                      className="transition-[fill,stroke,opacity] duration-150 cursor-pointer hover:stroke-white hover:stroke-[1.5px] hover:fill-opacity-100"
                      onClick={(e) => {
                        if (didDrag()) {
                          e.stopPropagation();
                          return;
                        }
                        setSelectedCountryCode(isSelected ? null : country.id);
                      }}
                    >
                      <title>
                        {country.name} {style ? `(${style.count} ${activeTab})` : ""}
                      </title>
                    </path>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Quick country selection pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 mr-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Active Regions:
            </span>

            {Array.from(profilesByCountry.entries())
              .filter(([code]) => code !== UNKNOWN_REGION)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([code, list]) => {
                const isSelected = selectedCountryCode === code;
                const flag = getCountryFlag(code);
                const name = getRegionName(code);

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
                    <span>{flag}</span>
                    <span>{name}</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white">
                      {list.length}
                    </span>
                  </button>
                );
              })}

            {/* Unknown location pill */}
            {unknownCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedCountryCode(selectedCountryCode === UNKNOWN_REGION ? null : UNKNOWN_REGION)
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  selectedCountryCode === UNKNOWN_REGION
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-lg shadow-amber-500/10 scale-105"
                    : "bg-white/[0.02] text-neutral-400 border-dashed border-white/[0.1] hover:text-neutral-300 hover:bg-white/[0.05]"
                }`}
              >
                <span>🌐</span>
                <span>Unspecified Location</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white">
                  {unknownCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Follower / Following Profile List & Drilldown (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[520px] rounded-3xl bg-[#090d17]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* List Header */}
          <div className="p-4 border-b border-white/[0.08] space-y-3 bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {selectedCountryCode ? (
                    <>
                      <span className="text-lg">{selectedCountryFlag}</span>
                      <span>{selectedCountryName}</span>
                    </>
                  ) : (
                    <span>All {activeTab === "following" ? "Followed Accounts" : "Followers"}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {displayedProfiles.length}
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {selectedCountryCode
                    ? `Accounts located in ${selectedCountryName}`
                    : `Full network directory across ${countryCounts.size} countries`}
                </p>
              </div>

              {selectedCountryCode && (
                <button
                  type="button"
                  onClick={() => setSelectedCountryCode(null)}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  View All
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab} by name, @handle or region...`}
                className="w-full bg-[#050812] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-white/[0.04] space-y-1">
            {displayedProfiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-neutral-600" />
                <p className="text-xs font-semibold text-neutral-400">
                  No {activeTab} match your criteria
                </p>
                <p className="text-[11px] text-neutral-500">
                  Try clearing your search query or selecting a different country.
                </p>
              </div>
            ) : (
              <>
                {pagedProfiles.map((profile) => (
                  <div
                    key={profile.login}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-colors flex-shrink-0">
                        <Image
                          src={profile.avatarUrl}
                          alt={profile.login}
                          fill
                          unoptimized
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {profile.name || profile.login}
                          </span>
                          {profile.cohortRank && (
                            <Link
                              href={`/users/${profile.login}`}
                              className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                              title="Classmate Cohort Member"
                            >
                              Rank #{profile.cohortRank}
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 truncate">
                          <span>@{profile.login}</span>
                          {profile.country && profile.country !== UNKNOWN_REGION && (
                            <span className="flex items-center gap-1 text-neutral-300">
                              <span>{profile.countryFlag}</span>
                              <span>{profile.countryName}</span>
                            </span>
                          )}
                        </div>

                        {profile.bio && (
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                      {profile.cohortRank && (
                        <Link
                          href={`/users/${profile.login}`}
                          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors"
                          title="View Classmate Profile"
                        >
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        </Link>
                      )}

                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
                        title="Open GitHub Profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}

                {/* Show more button when there are more profiles than visibleCount */}
                {displayedProfiles.length > visibleCount && (
                  <div className="pt-2 pb-1 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 30)}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto w-full"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>
                        Show More ({displayedProfiles.length - visibleCount} remaining)
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* List Footer Stats */}
          <div className="p-3 border-t border-white/[0.06] bg-[#050812] flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>
              Showing {Math.min(visibleCount, displayedProfiles.length)} of {displayedProfiles.length} accounts
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Sparkles className="w-3 h-3" />
              GitCharta Synchronized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
