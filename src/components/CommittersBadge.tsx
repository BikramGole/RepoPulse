"use client";

import React, { useState } from "react";

interface CommittersBadgeProps {
  countryName: string;
  login: string;
  followers: number;
}

// Minimum followers threshold required by Committers.top for public regional indexing
const MIN_FOLLOWERS_THRESHOLD = 34;

export function CommittersBadge({ countryName, login, followers }: CommittersBadgeProps) {
  const [hasError, setHasError] = useState(false);

  // If developer has less than 34 followers, they are ineligible for public Committers.top ranking
  if (followers < MIN_FOLLOWERS_THRESHOLD || hasError) {
    return null;
  }

  return (
    <div className="flex items-center">
      <img
        src={`https://user-badge.committers.top/${countryName.toLowerCase()}/${login}`}
        alt={`${login} ranking in ${countryName}`}
        className="h-7 rounded shadow-md object-contain transition-opacity duration-300"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
