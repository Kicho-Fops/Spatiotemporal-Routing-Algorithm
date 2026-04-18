// src/types/index.ts

export type ThematicData = {
  data: ThematicPoint[];
  attributeStats: Record<string, { min: number; max: number }>;
};

export type ThematicPoint = {
  lat: number;
  lon: number;
  [key: string]: number;
};

export type AggregatedEdges = {
  edges: PhysicalEdge[],
  attributeStats: Record<string, { min: number; max: number }>;
}

// Define a type for the processed edge data after aggregation
export type PhysicalEdge = {
  point0: SegmentData, // Point A
  point1: SegmentData, // Point B
  bearing: number,
  length: number,
  attributes: Record<string, number | undefined> | undefined
};

// More specific GeoJSONFeature type
export type GeoJSONFeature = { // Renamed from CustomGeoJSONFeature to simply GeoJSONFeature as it's the primary one now
  type: "Feature"; // Must be literal "Feature"
  geometry: {
    type: string; // This can remain broad if you handle specific geometry types later
    coordinates: any;
  };
  properties: Record<string, any> | undefined | undefined;
};

// More specific GeoJSONData type, aligning with Leaflet's expectations
export type GeoJSONData = { // Renamed from CustomGeoJSONData to simply GeoJSONData
  type: "FeatureCollection"; // Must be literal "FeatureCollection"
  features: GeoJSONFeature[];
  edges?: any[]; // This is a custom property, not standard GeoJSON
};

export type AggregationType = 'sum' | 'mean' | 'min' | 'max';
export type SpatialRelationType = 'buffer' | 'nn' | 'contains';

export type SegmentData = {
  lat: number;
  lon: number;
};

export type UnitType = {
  type: "segment" | "node";
  density?: string | number; 
  method?: "line" | "rect" | "matrix"; // Optional due to default in schema
  opacity?: string | number; // Optional due to default in schema, oneOf string/number
  color?: string; // Optional due to default in schema
  squiggle?: string; // Optional due to default in schema
  dash?: string; // Optional due to default in schema
  width?: string | number; // Optional due to default in schema, oneOf string/number
  height?: string | number; // Optional due to default in schema, oneOf string/number
  chart?: any; // Optional/nullable
  rows?: number; // Optional/nullable
  columns?: number; // Optional/nullable
  orientation?: "parallel" | "perpendicular" | "fixed"; // Optional due to default in schema
  alignment?: "left" | "center" | "right"; // Optional due to default in schema
};

// DEFINING ParsedSpec here
export interface ParsedSpec {
  name?: string;
  unit: UnitType;
  data: {
    physical: {
      path: string; // Required within physical
    };
    thematic: {
      path: string; // Required within thematic
      latColumn: string;
      lonColumn: string;
    };
  };
  relation?: { // Optional
    spatial?: SpatialRelationType; // Optional due to default
    value?: number; // Optional due to default
    type?: AggregationType; // Optional due to default
  };
  zoom?: [number, number]; // Optional due to default
  map?: {
    streetColor?: string; // Optional/nullable
    streetWidth?: number; // Optional/nullable
  };
  query?: {
    address?: string; // Optional/nullable
    radius?: number; // Optional/nullable
  };
}