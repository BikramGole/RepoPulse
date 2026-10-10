const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const UNKNOWN_REGION = "UNKNOWN";

export function getRegionName(code: string): string {
  if (!code || code === UNKNOWN_REGION) return "Unknown location";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode === UNKNOWN_REGION) return "🌐";
  const code = isoCode.toUpperCase();
  if (code.length !== 2) return "🌐";
  const offset = 127397;
  try {
    return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
  } catch {
    return "🌐";
  }
}
