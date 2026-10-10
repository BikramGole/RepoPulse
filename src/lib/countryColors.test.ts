import { describe, it, expect } from "vitest";
import { createHeatScale, COUNTRY_ACCENTS, MAP_BASE_STYLING } from "./countryColors";

describe("countryColors and heat scaling", () => {
  it("should have correct base map styling definitions", () => {
    expect(MAP_BASE_STYLING.spaceBackground).toBeDefined();
    expect(MAP_BASE_STYLING.oceanBackground).toBeDefined();
    expect(MAP_BASE_STYLING.defaultFill).toBeDefined();
  });

  it("should have valid hex accents for key countries", () => {
    expect(COUNTRY_ACCENTS.NP).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COUNTRY_ACCENTS.IN).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(COUNTRY_ACCENTS.US).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("should scale intensity logarithmically based on classmate density", () => {
    const counts = new Map<string, number>([
      ["NP", 28],
      ["IN", 2],
      ["US", 1],
    ]);

    const heatScale = createHeatScale(counts);

    const npIntensity = heatScale(28);
    const inIntensity = heatScale(2);
    const usIntensity = heatScale(1);

    expect(npIntensity).toBeGreaterThan(inIntensity);
    expect(inIntensity).toBeGreaterThan(usIntensity);
    expect(npIntensity).toBeLessThanOrEqual(1.0);
    expect(usIntensity).toBeGreaterThanOrEqual(0.35);
  });
});
