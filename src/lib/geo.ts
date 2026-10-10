// Ported and adapted from GitCharta core geocoding logic

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  lat: number;
  lng: number;
}

export const COUNTRIES_DATABASE: Record<string, CountryInfo> = {
  NP: { code: "NP", name: "Nepal", flag: "🇳🇵", lat: 28.3949, lng: 84.124 },
  IN: { code: "IN", name: "India", flag: "🇮🇳", lat: 20.5937, lng: 78.9629 },
  US: { code: "US", name: "United States", flag: "🇺🇸", lat: 37.0902, lng: -95.7129 },
  GB: { code: "GB", name: "United Kingdom", flag: "🇬🇧", lat: 55.3781, lng: -3.436 },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪", lat: 51.1657, lng: 10.4515 },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦", lat: 56.1304, lng: -106.3468 },
  AU: { code: "AU", name: "Australia", flag: "🇦🇺", lat: -25.2744, lng: 133.7751 },
  JP: { code: "JP", name: "Japan", flag: "🇯🇵", lat: 36.2048, lng: 138.2529 },
  FR: { code: "FR", name: "France", flag: "🇫🇷", lat: 46.2276, lng: 2.2137 },
  SG: { code: "SG", name: "Singapore", flag: "🇸🇬", lat: 1.3521, lng: 103.8198 },
  BD: { code: "BD", name: "Bangladesh", flag: "🇧🇩", lat: 23.685, lng: 90.3563 },
  PK: { code: "PK", name: "Pakistan", flag: "🇵🇰", lat: 30.3753, lng: 69.3451 },
  BR: { code: "BR", name: "Brazil", flag: "🇧🇷", lat: -14.235, lng: -51.9253 },
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱", lat: 52.1326, lng: 5.2913 },
};

const CITY_COUNTRY_LOOKUP: Record<string, string> = {
  // Nepal
  kathmandu: "NP",
  ktm: "NP",
  pokhara: "NP",
  lalitpur: "NP",
  bhaktapur: "NP",
  patan: "NP",
  nepal: "NP",
  dharan: "NP",
  butwal: "NP",
  biratnagar: "NP",
  chitwan: "NP",
  hetauda: "NP",

  // India
  india: "IN",
  delhi: "IN",
  mumbai: "IN",
  bangalore: "IN",
  bengaluru: "IN",
  hyderabad: "IN",
  chennai: "IN",
  kolkata: "IN",
  pune: "IN",

  // USA
  usa: "US",
  "united states": "US",
  "san francisco": "US",
  sf: "US",
  seattle: "US",
  "new york": "US",
  nyc: "US",
  austin: "US",
  california: "US",

  // UK & Europe
  london: "GB",
  uk: "GB",
  "united kingdom": "GB",
  berlin: "DE",
  germany: "DE",
  munich: "DE",
  paris: "FR",
  france: "FR",
  amsterdam: "NL",
  netherlands: "NL",

  // Asia Pacific
  singapore: "SG",
  tokyo: "JP",
  japan: "JP",
  sydney: "AU",
  australia: "AU",
  melbourne: "AU",
  dhaka: "BD",
  bangladesh: "BD",
};

export function resolveUserLocation(rawLocation: string | null): CountryInfo | null {
  if (!rawLocation) {
    // If classmate without specified location, default to Nepal based on class network context
    return COUNTRIES_DATABASE.NP;
  }

  const normalized = rawLocation
    .toLowerCase()
    .replace(/[^a-z\s,]/g, " ")
    .trim();

  // Check direct country code match
  if (normalized === "np" || normalized.includes("nepal")) return COUNTRIES_DATABASE.NP;
  if (normalized === "in" || normalized.includes("india")) return COUNTRIES_DATABASE.IN;
  if (normalized === "us" || normalized.includes("usa") || normalized.includes("united states")) return COUNTRIES_DATABASE.US;

  // Split tokens and check dictionary
  const tokens = normalized.split(/[\s,]+/);
  for (const token of tokens) {
    const code = CITY_COUNTRY_LOOKUP[token];
    if (code && COUNTRIES_DATABASE[code]) {
      return COUNTRIES_DATABASE[code];
    }
  }

  // Full string substring check
  for (const [key, code] of Object.entries(CITY_COUNTRY_LOOKUP)) {
    if (normalized.includes(key) && COUNTRIES_DATABASE[code]) {
      return COUNTRIES_DATABASE[code];
    }
  }

  return COUNTRIES_DATABASE.NP;
}
