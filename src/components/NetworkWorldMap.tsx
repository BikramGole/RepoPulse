"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { RankedUser } from "@/types";
import { COUNTRIES_DATABASE } from "@/lib/geo";
import { Globe, Users, MapPin, ExternalLink, ArrowRight } from "lucide-react";

interface NetworkWorldMapProps {
  users: RankedUser[];
}

export function NetworkWorldMap({ users }: NetworkWorldMapProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);

  // Group users by country
  const countryDistribution = useMemo(() => {
    const map: Record<string, { count: number; users: RankedUser[] }> = {};

    for (const user of users) {
      const code = user.country?.code || "NP";
      if (!map[code]) {
        map[code] = { count: 0, users: [] };
      }
      map[code].count++;
      map[code].users.push(user);
    }

    return Object.entries(map)
      .map(([code, data]) => ({
        info: COUNTRIES_DATABASE[code] || {
          code,
          name: code,
          flag: "🌐",
          lat: 20,
          lng: 80,
        },
        count: data.count,
        percentage: Math.round((data.count / users.length) * 100),
        users: data.users,
      }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  const activeCountry = selectedCountryCode
    ? countryDistribution.find((c) => c.info.code === selectedCountryCode)
    : countryDistribution[0];

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Globe className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: "12s" }} />
            GitCharta Network Visualizer
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Classmate Geographic Footprint
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Geocoded from developer profiles, showing international network reach across {countryDistribution.length} regions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-mono">
            <span className="text-neutral-400">Global Reach: </span>
            <span className="font-bold text-white">{countryDistribution.length} Countries</span>
          </div>
        </div>
      </div>

      {/* World Map SVG representation with pins */}
      <div className="p-6 rounded-3xl bg-[#0a0e17] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            Interactive Regional Pins
          </span>
          <span className="text-[11px] text-neutral-500">
            Click on any country badge below to inspect classmates
          </span>
        </div>

        {/* Simplified high-tech SVG map canvas */}
        <div className="relative w-full aspect-[2.1/1] max-h-[380px] rounded-2xl bg-[#060911] border border-white/[0.05] flex items-center justify-center overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Stylized world SVG paths */}
          <svg viewBox="0 0 1000 500" className="w-full h-full opacity-35">
            <g fill="#1e293b" stroke="#334155" strokeWidth="0.5">
              {/* Simplified landmass contours */}
              <ellipse cx="250" cy="180" rx="140" ry="80" />
              <ellipse cx="320" cy="330" rx="70" ry="110" />
              <ellipse cx="550" cy="150" rx="90" ry="60" />
              <ellipse cx="720" cy="170" rx="190" ry="90" />
              <ellipse cx="550" cy="270" rx="70" ry="90" />
              <ellipse cx="800" cy="360" rx="60" ry="40" />
            </g>
          </svg>

          {/* Dynamic Geographic Pins based on longitude & latitude */}
          {countryDistribution.map(({ info, count }) => {
            // Project lat/lng to SVG space 1000x500 (approximate equirectangular)
            const x = ((info.lng + 180) / 360) * 1000;
            const y = ((90 - info.lat) / 180) * 500;
            const isSelected = activeCountry?.info.code === info.code;

            return (
              <div
                key={info.code}
                onClick={() => setSelectedCountryCode(info.code)}
                style={{
                  position: "absolute",
                  left: `${(x / 1000) * 100}%`,
                  top: `${(y / 500) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="cursor-pointer group z-10"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-rose-500 ring-4 ring-rose-500/30 scale-125"
                        : "bg-blue-500/80 hover:bg-rose-400 group-hover:scale-110"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div
                    className={`absolute -bottom-6 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap shadow-xl transition-all ${
                      isSelected
                        ? "bg-white text-black scale-105"
                        : "bg-neutral-900/90 text-neutral-300 border border-white/10 group-hover:bg-neutral-800"
                    }`}
                  >
                    {info.flag} {info.name} ({count})
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Country distribution selection pills */}
        <div className="flex flex-wrap gap-2 mt-5">
          {countryDistribution.map(({ info, count, percentage }) => {
            const isSelected = activeCountry?.info.code === info.code;
            return (
              <button
                key={info.code}
                onClick={() => setSelectedCountryCode(info.code)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/10"
                    : "bg-white/[0.03] text-neutral-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span className="text-base leading-none">{info.flag}</span>
                <span className="font-semibold">{info.name}</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-white/[0.08] text-neutral-300">
                  {count} ({percentage}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Country Classmates List */}
      {activeCountry && (
        <div className="p-6 rounded-3xl bg-[#0e131f]/90 border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-xl">{activeCountry.info.flag}</span>
              Developers in {activeCountry.info.name} ({activeCountry.users.length})
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {activeCountry.percentage}% of overall network
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeCountry.users.map((user) => (
              <Link
                key={user.login}
                href={`/users/${user.login}`}
                className="group p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.login}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {user.name || user.login}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono">@{user.login}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {user.totalContributions.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-neutral-500">commits</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
