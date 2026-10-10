import { describe, it, expect } from "vitest";
import { resolveLocationToCountry, localizeProfile } from "./geocode";
import { getRegionName, getCountryFlag } from "./region";

describe("GitCharta Geocoder", () => {
  it("resolves various cities and countries correctly", () => {
    expect(resolveLocationToCountry("Kathmandu, Nepal")).toBe("NP");
    expect(resolveLocationToCountry("Pokhara")).toBe("NP");
    expect(resolveLocationToCountry("San Francisco, CA")).toBe("US");
    expect(resolveLocationToCountry("London, United Kingdom")).toBe("GB");
    expect(resolveLocationToCountry("Berlin, Germany")).toBe("DE");
    expect(resolveLocationToCountry("Tokyo, Japan")).toBe("JP");
    expect(resolveLocationToCountry("Bengaluru, India")).toBe("IN");
    expect(resolveLocationToCountry("Paris, France")).toBe("FR");
    expect(resolveLocationToCountry("Sydney, Australia")).toBe("AU");
  });

  it("handles unknown or empty locations gracefully", () => {
    expect(resolveLocationToCountry(null)).toBe("UNKNOWN");
    expect(resolveLocationToCountry("")).toBe("UNKNOWN");
    expect(resolveLocationToCountry("The Moon")).toBe("UNKNOWN");
  });

  it("localizes profiles with flag, name, and country code", () => {
    const profile = localizeProfile({
      login: "testdev",
      location: "Pokhara, Nepal",
      name: "Test Developer",
    });

    expect(profile.country).toBe("NP");
    expect(profile.countryName).toBe("Nepal");
    expect(profile.countryFlag).toBe("🇳🇵");
    expect(profile.login).toBe("testdev");
  });

  it("resolves flag emojis correctly", () => {
    expect(getCountryFlag("NP")).toBe("🇳🇵");
    expect(getCountryFlag("US")).toBe("🇺🇸");
    expect(getCountryFlag("UNKNOWN")).toBe("🌐");
  });

  it("resolves country names correctly", () => {
    expect(getRegionName("NP")).toBe("Nepal");
    expect(getRegionName("US")).toBe("United States");
  });
});
