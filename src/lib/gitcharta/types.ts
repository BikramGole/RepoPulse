export interface AudienceProfile {
  login: string;
  id?: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  company?: string | null;
  location: string | null;
  twitterUsername?: string | null;
  bio?: string | null;
  country: string; // ISO 2-letter code or "UNKNOWN"
  countryName: string;
  countryFlag: string;
  cohortRank?: number; // Leaderboard rank if in the RepoPulse cohort
}

export type AudienceType = "followers" | "following" | "mutuals";

export interface UserAudienceData {
  username: string;
  followers: AudienceProfile[];
  following: AudienceProfile[];
  mutuals: AudienceProfile[];
  updatedAt: string;
}
