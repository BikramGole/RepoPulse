export interface GeoProperties {
  NAME_EN: string;
  ISO_A2_EH: string;
}

export interface CountryFeature {
  type: "Feature";
  properties: GeoProperties;
  geometry: any;
}

export interface WorldGeoJson {
  type: "FeatureCollection";
  features: CountryFeature[];
}

export interface CountryPath {
  id: string;
  name: string;
  svgPath: string;
  opacity: number;
}

export type MapMode = "GLOBE" | "SPHERE";
