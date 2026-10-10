"use client";

import React, { useState } from "react";

interface CommittersBadgeProps {
  countryName: string;
  login: string;
}

export function CommittersBadge({ countryName, login }: CommittersBadgeProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

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
