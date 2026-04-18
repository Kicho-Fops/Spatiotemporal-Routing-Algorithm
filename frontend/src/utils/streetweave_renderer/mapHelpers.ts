// src/utils/mapHelpers.ts

import L from 'leaflet';

export const createPaneIfNeeded = (map: L.Map, paneName: string) => {
  if (!map.getPane(paneName)) {
    map.createPane(paneName);
    map.getPane(paneName)!.style.zIndex = '400';
  }
}

export function bindMapEvents(map: L.Map, onRedraw: any) {
  map.on('moveend zoomend', onRedraw);
  return () => map.off('moveend zoomend', onRedraw);
}

/**
 * Initializes the Leaflet map with a base tile layer.
 * @param mapContainer The HTML element for the map.
 * @param initialLat Initial latitude.
 * @param initialLon Initial longitude.
 * @param initialZoom Initial zoom level.
 * @param backgroundValue The background theme ('dark', 'light', or default).
 * @returns The initialized Leaflet map instance.
 */
export const initializeMap = (
  mapContainer: HTMLElement,
  initialLat: number,
  initialLon: number,
  initialZoom: number,
  backgroundValue: string
): L.Map => {
  const map = L.map(mapContainer).setView([initialLat, initialLon], initialZoom);

  let tileUrl = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  // let tileUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png";
  let maxZoom = 20;

  if (backgroundValue === "dark") {
    tileUrl = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
    // tileUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
    maxZoom = 19;
  }

  L.tileLayer(tileUrl, {
    maxZoom,
    attribution:
      '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> ' +
      '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> ' +
      '&copy; <a href="https://www.openstreetmap.org/copyright" ' +
      'target="_blank">OpenStreetMap</a>',
  }).addTo(map);

  return map;
};

/**
 * Projects LatLng coordinates to Leaflet layer points.
 * @param mapInstance The Leaflet map instance.
 * @param lat Latitude.
 * @param lon Longitude.
 * @returns An array [x, y] of screen coordinates.
 */
export function projectPoint(mapInstance: L.Map, lat: number, lon: number): [number, number] {
  const point = mapInstance.latLngToLayerPoint(new L.LatLng(lat, lon));
  return [point.x, point.y];
}

/**
 * Calculates the line width based on zoom level and base width.
 * @param mapInstance The Leaflet map instance.
 * @param baseWidth The base line width.
 * @returns The adjusted line width.
 */
export const getAdjustedLineWidth = (mapInstance: L.Map, baseWidth: number): number => {
  const zoom = mapInstance.getZoom();
  if (zoom <= 12) return baseWidth * 0.5;
  if (zoom > 12 && zoom <= 14) return baseWidth;
  if (zoom > 14 && zoom <= 16) return baseWidth * 1.2;
  if (zoom > 16 && zoom <= 17) return baseWidth * 1.5;
  if (zoom > 17 && zoom <= 18) return baseWidth * 2;
  return baseWidth * 3;
};

/**
 * Calculates the offset distance for parallel lines based on zoom level.
 * @param mapInstance The Leaflet map instance.
 * @returns The offset distance in meters.
 */
export const getOffsetDistance = (mapInstance: L.Map): number => {
  const zoom = mapInstance.getZoom();
  if (zoom >= 18) return 6;
  if (zoom <= 16) return 15;
  return ((18 - zoom) / (18 - 16)) * 15; // Interpolate
};
