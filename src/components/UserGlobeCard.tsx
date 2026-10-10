"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { RankedUser } from "@/types";
import { COUNTRIES_DATABASE } from "@/lib/geo";
import { Globe, MapPin, Compass, Navigation, ArrowUpRight } from "lucide-react";

interface UserGlobeCardProps {
  user: RankedUser;
}

export function UserGlobeCard({ user }: UserGlobeCardProps) {
  const countryCode = user.country?.code || "NP";
  const countryInfo = COUNTRIES_DATABASE[countryCode] || {
    code: countryCode,
    name: user.location || "Nepal",
    flag: "🇳🇵",
    lat: 28.3949,
    lng: 84.124,
  };

  return (
    <div className="p-6 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "16s" }} />
            GitCharta Geolocation Intelligence
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Regional Cohort Node</span>
            <span className="text-xl">{countryInfo.flag}</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Geocoded to {countryInfo.name} ({countryInfo.lat.toFixed(2)}° N, {countryInfo.lng.toFixed(2)}° E)
          </p>
        </div>

        <Link
          href="/#map"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-semibold text-cyan-300 transition-all group w-fit"
        >
          <Globe className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          View on 3D Network Globe
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Country Hub
          </span>
          <p className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
            <span>{countryInfo.name}</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
              {countryInfo.code}
            </span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            Global Coordinates
          </span>
          <p className="text-sm font-bold font-mono text-neutral-200 mt-1.5">
            {countryInfo.lat > 0 ? `${countryInfo.lat}°N` : `${Math.abs(countryInfo.lat)}°S`},{" "}
            {countryInfo.lng > 0 ? `${countryInfo.lng}°E` : `${Math.abs(countryInfo.lng)}°W`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Network Presence
          </span>
          <p className="text-sm font-bold text-emerald-400 mt-1.5">
            Primary Hub Classmate
          </p>
        </div>
      </div>
    </div>
  );
}
