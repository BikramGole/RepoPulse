"use client";

import React from "react";
import { RankedUser } from "@/types";
import { GlobeMap } from "@/components/GlobeMap";

interface NetworkWorldMapProps {
  users: RankedUser[];
}

export function NetworkWorldMap({ users }: NetworkWorldMapProps) {
  return <GlobeMap users={users} />;
}
