import { CN } from "./constants/countries";
import { CDICT } from "./constants/lookupTables";
import { SKIP } from "./constants/unlocated";
import { getRegionName, getCountryFlag, UNKNOWN_REGION } from "./region";
import { AudienceProfile } from "./types";

const LOWER_CDICT = new Map<string, string>(
  Object.entries(CDICT).map(([city, country]) => [city.toLowerCase(), country])
);

const NOISE_WORDS =
  /\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi;
const NON_LETTER = /[^a-zA-Z\p{L}\u{1F1E6}-\u{1F1FF}]/gu;
const LONE_FLAG =
  /(?<![\u{1F1E6}-\u{1F1FF}])[\u{1F1E6}-\u{1F1FF}](?![\u{1F1E6}-\u{1F1FF}])/gu;
const DELIMITER =
  /(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[()|/\s\-_.,;:!?@#&[\]{}<>*+=%^~$`"\\]+/;

const normalise = (s: string): string => s.normalize("NFD").replace(/\p{Mn}/gu, "");

export const cleanLoc = (raw: string | null): string[] => {
  if (!raw?.trim()) return [];

  const pieces = raw
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
    .split(DELIMITER)
    .map((chunk) =>
      normalise(
        chunk
          .replace(NOISE_WORDS, "")
          .replace(NON_LETTER, "")
          .replace(LONE_FLAG, "")
          .trim()
          .toLowerCase()
      )
    )
    .filter(Boolean);

  if (pieces.length === 0) return [];
  if (pieces.length === 1) return pieces;

  const ngrams: string[] = [];
  for (let len = pieces.length; len >= 1; len--) {
    for (let start = 0; start <= pieces.length - len; start++) {
      ngrams.push(pieces.slice(start, start + len).join(" "));
    }
  }
  return [...new Set(ngrams)];
};

export const guessCountry = (locations: string[]): string | null => {
  if (locations.length === 0) return null;

  for (const token of locations) {
    const country = CN[token as keyof typeof CN];
    if (country) return country;
  }

  for (const TOKEN of locations) {
    const token = TOKEN.toLowerCase();
    if (SKIP.has(token)) return "SKIP";

    const countryFromDict = LOWER_CDICT.get(token);
    if (countryFromDict) return countryFromDict;
  }

  return null;
};

/**
 * Resolves any raw location string into an ISO 2-letter country code (or UNKNOWN_REGION)
 */
export function resolveLocationToCountry(rawLocation: string | null): string {
  if (!rawLocation) return UNKNOWN_REGION;
  const cleaned = cleanLoc(rawLocation);
  if (cleaned.length === 0) return UNKNOWN_REGION;
  const guessed = guessCountry(cleaned);
  if (!guessed || guessed === "SKIP") return UNKNOWN_REGION;
  return guessed.toUpperCase();
}

/**
 * Localizes an audience profile by attaching its resolved country, full name, and flag emoji.
 */
export function localizeProfile<T extends { login: string; location?: string | null }>(
  profile: T,
  knownCohortRank?: number,
  fallbackCountry?: string
): AudienceProfile {
  let country = resolveLocationToCountry(profile.location || null);
  if (country === UNKNOWN_REGION && fallbackCountry) {
    country = fallbackCountry;
  }

  return {
    login: profile.login,
    name: (profile as { name?: string | null }).name || null,
    avatarUrl: (profile as { avatarUrl?: string }).avatarUrl || `https://github.com/${profile.login}.png`,
    url: (profile as { url?: string }).url || `https://github.com/${profile.login}`,
    company: (profile as { company?: string | null }).company || null,
    location: profile.location || null,
    bio: (profile as { bio?: string | null }).bio || null,
    country,
    countryName: getRegionName(country),
    countryFlag: getCountryFlag(country),
    cohortRank: knownCohortRank,
  };
}
