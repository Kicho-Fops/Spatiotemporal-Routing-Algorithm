// src/utils/geoHelpers.ts

import * as d3 from 'd3';
import * as turf from '@turf/turf';
import { Feature, MultiPolygon, Point, Polygon } from 'geojson';
import { GeoJSONData, GeoJSONFeature, PhysicalEdge, SegmentData, ThematicPoint, ThematicData } from 'streetweave';


/**
 * Calculates the centroid of a Polygon or MultiPolygon geometry using Turf.js.
 * @param geometry The Polygon or MultiPolygon geometry.
 * @returns A Turf.js Point feature representing the centroid.
 * @throws Error if the geometry is not a Polygon or MultiPolygon.
 */
export const calculateCentroid = (geometry: { type: string; coordinates: any[] }): Feature<Point> => {
  if (geometry.type === 'MultiPolygon') {
    return turf.centroid(turf.multiPolygon(geometry.coordinates));
  } else if (geometry.type === 'Polygon') {
    return turf.centroid(turf.polygon(geometry.coordinates));
  } else {
    throw new Error('Expected Polygon or MultiPolygon geometry');
  }
};

/**
 * Calculates the midpoint between two {lat, lon} objects.
 * @param coord1 The first coordinate.
 * @param coord2 The second coordinate.
 * @returns The midpoint coordinate.
 */
export function calculateMidpoint(
  coord1: { lat: number; lon: number },
  coord2: { lat: number; lon: number }
): { lat: number; lon: number } {
  return {
    lat: (coord1.lat + coord2.lat) / 2,
    lon: (coord1.lon + coord2.lon) / 2,
  };
}

/**
 * Calculates Euclidean distance using Turf.js.
 * @param point1 The first Turf.js Point feature.
 * @param point2 The second Turf.js Point feature.
 * @returns The distance in kilometers.
 */
export const calculateDistance = (point1: Feature<Point>, point2: Feature<Point>): number => {
  return turf.distance(point1, point2, { units: 'kilometers' });
};

/**
 * Computes distances from a centroid to thematic data points.
 * @param centroid The centroid point.
 * @param thematicData The array of thematic points.
 * @returns An array of objects with index and distance.
 */
export const calculateDistances = (
  centroid: Feature<Point>,
  thematicData: ThematicPoint[]
): { index: number; distance: number }[] => {
  return thematicData.map((point, index) => {
    const pointCoords = turf.point([point.lon, point.lat]);
    const distance = calculateDistance(centroid, pointCoords);
    return { index, distance };
  });
};

/**
 * Finds the closest points in thematicData based on distance.
 * @param distances An array of objects with index and distance.
 * @param thematicData The array of thematic points.
 * @param numberOfPoints The number of closest points to return (default: 50).
 * @returns An array of the closest thematic points.
 */
export const findClosestPoints = (
  distances: { index: number; distance: number }[],
  thematicData: ThematicPoint[],
  numberOfPoints = 50
): ThematicPoint[] => {
  const sorted = [...distances].sort((a, b) => a.distance - b.distance);
  return sorted.slice(0, numberOfPoints).map(d => thematicData[d.index]);
};

/**
 * Creates a buffer around a given point.
 * @param point The Turf.js Point feature.
 * @param bufferDistance The buffer distance in meters.
 * @returns A Turf.js Polygon or MultiPolygon feature representing the buffer, or null if invalid.
 */
export function createBuffer(point: Feature<Point>, bufferDistance: number): Feature<Polygon | MultiPolygon> | null {
  const buffered = turf.buffer(point, bufferDistance, { units: 'meters' });
  if (!buffered || !buffered.geometry ||
    (buffered.geometry.type !== 'Polygon' && buffered.geometry.type !== 'MultiPolygon')) {
    return null;
  }
  return buffered as Feature<Polygon | MultiPolygon>;
}

/**
 * Filters thematic points that fall within a given buffer.
 * @param buffer The buffer polygon.
 * @param points The array of thematic points.
 * @returns An array of thematic points within the buffer.
 */
export function filterPointsInBuffer(
  buffer: Feature<Polygon | MultiPolygon>,
  points: ThematicPoint[]
): ThematicPoint[] {
  return points.filter(point => {
    const pointCoords = turf.point([point.lon, point.lat]);
    return turf.booleanPointInPolygon(pointCoords, buffer);
  });
}

/**
 * Converts a bearing (in degrees) to one of 8 cardinal directions.
 * @param bearing The bearing in degrees.
 * @returns The cardinal direction string.
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const index = Math.floor((bearing + 22.5) / 45) % 8;
  return directions[index];
}

/**
 * Offsets a geographic point by a given bearing and distance.
 * @param lat Latitude of the original point.
 * @param lon Longitude of the original point.
 * @param bearing Bearing in degrees.
 * @param distance Distance in meters.
 * @returns The new [latitude, longitude] coordinates.
 */
export function offsetPoint(lat: number, lon: number, bearing: number, distance: number): [number, number] {
  const R = 6378137; // Earth's radius in meters
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const lat1 = lat * toRad;
  const lon1 = lon * toRad;
  const brng = bearing * toRad;
  const dR = distance / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dR) +
    Math.cos(lat1) * Math.sin(dR) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(dR) * Math.cos(lat1),
    Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2)
  );
  return [lat2 * toDeg, lon2 * toDeg];
}


export async function loadThematicData(
  path: string,
  latColumnName: string,
  lonColumnName: string
): Promise<ThematicData> {
  const processedData: ThematicPoint[] = [];
  const attributeMins: Record<string, number> = {};
  const attributeMaxs: Record<string, number> = {};

  let thematicData: Array<Record<string, any>>;
  try {
    thematicData = await d3.csv(`/data/${path}`,  d3.autoType);
  } catch (error) {
    console.error(`Error loading thematic data from data/${path}:`, error);
    return { data: [], attributeStats: {} };
  }
  

  for (const d of thematicData) {
    const newRow: Record<string, any> = { ...d }; // Start with a copy of the original row

    let lat: number | null = null;
    let lon: number | null = null;

    // Process latitude
    if (d[latColumnName] !== undefined && d[latColumnName] !== null) {
      const parsedLat = parseFloat(d[latColumnName]);
      if (!isNaN(parsedLat)) {
        lat = parsedLat;
      }
    }

    // Process longitude
    if (d[lonColumnName] !== undefined && d[lonColumnName] !== null) {
      const parsedLon = parseFloat(d[lonColumnName]);
      if (!isNaN(parsedLon)) {
        lon = parsedLon;
      }
    }

    // Process attributes
    for (const key in newRow) {
      if (key === 'lat' || key === 'lon' || key === latColumnName || key === lonColumnName) {
          continue;
      }
      const value = newRow[key];
      let finalValue: number | string | boolean | null = value; 
      // Track min/max for numeric attributes
      if (typeof finalValue === 'number' && !isNaN(finalValue)) {
        if (attributeMins[key] === undefined || finalValue < attributeMins[key]) {
          attributeMins[key] = finalValue;
        }
        if (attributeMaxs[key] === undefined || finalValue > attributeMaxs[key]) {
          attributeMaxs[key] = finalValue;
        }
      }
    }

    if (lat !== null && lon !== null) {
      newRow.lat = lat;
      newRow.lon = lon;
      processedData.push(newRow as ThematicPoint);
    } else {
      console.warn(`Skipping row due to invalid/missing lat/lon: Original data for latCol '${latColumnName}': '${d[latColumnName]}', lonCol '${lonColumnName}': '${d[lonColumnName]}'`, d);
    }
  }

  const attributeStats: Record<string, { min: number; max: number }> = {};
  console.log(attributeMaxs);
  for (const key in attributeMins) {
    if (attributeMins.hasOwnProperty(key) && attributeMaxs.hasOwnProperty(key)) {
      attributeStats[key] = {
        min: attributeMins[key],
        max: attributeMaxs[key]
      };
    }
  }

  return {
    data: processedData,
    attributeStats: attributeStats
  };
}

export async function fetchGeoJSON(path: string) {

    const request = new Request(path, {
      method: "POST",
       headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
          city: "chicago",
          origin: {
              lat: 41.88623245009205,
              lon: -87.79178242221495
          },
          destination: {
              lat: 41.7905674,
              lon: -87.5831307
          },
          map_view_mode: "Custom weights",
          paths: 5,
          weather : ["rain", "heat", "wind", "humidity"],
          weights: [0.37, 0.20, 0.20, 0.20],
          time: 17,
          Graph_name: "chicago",
          output_format: "geojson"
      }),
    });
    
  
    const response = await fetch(request);
    if (!response.ok) {
      console.error(`Error fetching GeoJSON data: ${response.statusText}`);
      return null;
    }
    const jsonResponse = await response.json(); 
    return jsonResponse;
  }

  


export async function loadAPIData( path: string,
): Promise<PhysicalEdge[]> {
  let geojsonData;
  console.log("fetching geojson data from api with path:", path);
  try {
      geojsonData = await fetchGeoJSON(path);
      console.log("checking algo:", geojsonData);
  } catch (error) {
    console.error(`Error loading physical data from ${path}:`, error);
    return [];
  }

   let featuresToProcess: GeoJSONFeature[] = [];
  if(geojsonData) {
    if (geojsonData.type === "FeatureCollection" && geojsonData.features) {
      featuresToProcess = geojsonData.features;
    } else if (geojsonData.type === "Feature") {
      featuresToProcess = [geojsonData]; // Wrap single Feature in an array
    } else {
      console.error(`GeoJSON from ${path} is not a valid FeatureCollection or Feature with geometry. Skipping.`);
      return [];
    }
  } else {
    console.error(`Error loading physical data from ${path}. Data is undefined.`);
    return [];
  }

  const processedEdges: PhysicalEdge[] = [];
  for (const feature of featuresToProcess) {
    if (feature.geometry && feature.geometry.type === "LineString" && feature.geometry.coordinates) {
      
 
      const numericAttributes: Record<string, number> = {};
      if (feature.properties) {
        for (const [key, val] of Object.entries(feature.properties)) {
          if (typeof val === 'number') {
            numericAttributes[key] = val;
          }
        }
      }

      const coords = feature.geometry.coordinates;
      if (coords.length >= 2) {
        for (let i = 0; i < coords.length - 1; i++) {
          const startCoord = coords[i];
          const endCoord = coords[i + 1]; 

          const p0: SegmentData = { lat: startCoord[1], lon: startCoord[0] };
          const p1: SegmentData = { lat: endCoord[1], lon: endCoord[0] };


          const turfStart = turf.point(startCoord);
          const turfEnd = turf.point(endCoord);


          const bearing: number = turf.bearing(turfStart, turfEnd);


          const segmentLine = turf.lineString([startCoord, endCoord]);
          const length: number = turf.length(segmentLine, { units: 'meters' });

          const processedEdgeTuple: PhysicalEdge = {
            point0: p0,
            point1: p1,
            bearing: bearing,
            length: length,
            attributes: numericAttributes 
          };
          processedEdges.push(processedEdgeTuple);
        }
      }
    }
  }

  return processedEdges;
}

export async function loadPhysicalData(
  path: string,
): Promise<PhysicalEdge[]> {

  let geojsonData;
  try {
    geojsonData = await d3.json(`/data/${path}`) as GeoJSONData | GeoJSONFeature | undefined;
  } catch (error) {
    console.error(`Error loading physical data from data/${path}:`, error);
    return [];
  }

  let featuresToProcess: GeoJSONFeature[] = [];
  if(geojsonData) {
    if (geojsonData.type === "FeatureCollection" && geojsonData.features) {
      featuresToProcess = geojsonData.features;
    } else if (geojsonData.type === "Feature") {
      featuresToProcess = [geojsonData]; // Wrap single Feature in an array
    } else {
      console.error(`GeoJSON from data/${path} is not a valid FeatureCollection or Feature with geometry. Skipping.`);
      return [];
    }
  }
  else {
    console.error(`Error loading physical data from data/${path}.`);
    return [];
  }

  const processedEdges: PhysicalEdge[] = [];
  for (const feature of featuresToProcess) {
    if (feature.geometry && feature.geometry.type === "LineString" && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates;
      if (coords.length >= 2) {
        for (let i = 0; i < coords.length - 1; i++) {
          const startCoord = coords[i]; // [lon, lat]
          const endCoord = coords[i + 1]; // [lon, lat]

          const p0: SegmentData = { lat: startCoord[1], lon: startCoord[0] };
          const p1: SegmentData = { lat: endCoord[1], lon: endCoord[0] };

          // Create Turf.js points for calculations
          const turfStart = turf.point(startCoord);
          const turfEnd = turf.point(endCoord);

          // Calculate Bearing (in degrees) using Turf.js
          const bearing: number = turf.bearing(turfStart, turfEnd); // Turf.js returns a number

          // Calculate Length
          const segmentLine = turf.lineString([startCoord, endCoord]);
          const length: number = turf.length(segmentLine, { units: 'meters' }); // Length in meters

          // Create the PhysicalEdge tuple in the format expected by aggregateSegmentBuffer
          const processedEdgeTuple: PhysicalEdge = {
            point0: p0,
            point1: p1,
            bearing: bearing,
            length: length,
            attributes: undefined
          };
          processedEdges.push(processedEdgeTuple);
        }
      }
    }
  }

  return processedEdges;
  
}