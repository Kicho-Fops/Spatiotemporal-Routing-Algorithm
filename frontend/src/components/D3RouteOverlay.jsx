import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as d3 from "d3";
import L from "leaflet";
import { useSelector } from "react-redux";

// Streetweave
import {
  buildD3Instructions,
  drawSegments,
} from "../utils/streetweave_renderer/d3Helpers";
import { getOffsetDistance } from "../utils/streetweave_renderer/mapHelpers";

export default function D3RouteOverlay() {
  const map = useMap();
  
  const svgRef = useRef(null);

  const specifications = useSelector(
    (state) => state.Specification.specifications,
  );

  const routesArray = useSelector((state) => state.Route.routes);

  useEffect(() => {
    if (!map || !specifications?.length) return;

    const normalizeFeatures = (source) => {
      if (!source) return [];
      if (source?.type === "FeatureCollection" && Array.isArray(source.features)) {
        return source.features;
      }
      if (Array.isArray(source?.route_coords)) {
        return source.route_coords;
      }
      if (Array.isArray(source)) {
        return source;
      }
      return [];
    };

    const parseFeaturesToEdges = (features) => {
      const formattedEdges = [];
      const attributeStats = {};

      features.forEach((feature) => {
        const isGeoFeature = !!feature?.geometry;
        const coords = isGeoFeature ? feature.geometry?.coordinates : feature?.coordinates;
        const props = isGeoFeature ? feature.properties : feature;

        if (!Array.isArray(coords) || coords.length < 2) return;

        const edgeAttributes = {
          heat_exposure: props?.heat_exposure,
          humidity_exposure: props?.humidity_exposure,
          rain_exposure: props?.rain_exposure,
          wind_exposure: props?.wind_exposure,
          distance: props?.distance,
          duration: props?.duration,
          repeated: props?.repeated || 1,
          color: props?.color || 1,
        };

        Object.keys(edgeAttributes).forEach((key) => {
          if (typeof edgeAttributes[key] === "number") {
            if (!attributeStats[key]) {
              attributeStats[key] = { min: Infinity, max: -Infinity };
            }
            attributeStats[key].min = Math.min(attributeStats[key].min, edgeAttributes[key]);
            attributeStats[key].max = Math.max(attributeStats[key].max, edgeAttributes[key]);
          }
        });

        for (let i = 0; i < coords.length - 1; i++) {
          formattedEdges.push({
            point0: { lat: coords[i][1], lon: coords[i][0] },
            point1: { lat: coords[i + 1][1], lon: coords[i + 1][0] },
            bearing: 0,
            attributes: edgeAttributes,
          });
        }
      });

      return { formattedEdges, attributeStats };
    };

    // 1. Setup Layer
    if (!map.getPane("d3-routes-pane")) {
      map.createPane("d3-routes-pane");
      map.getPane("d3-routes-pane").style.zIndex = 450;
      map.getPane("d3-routes-pane").style.pointerEvents = "none";
    }
    
    d3.select(map.getPanes()["d3-routes-pane"]).selectAll("svg").remove();
    
    const svgLayer = L.svg({ pane: "d3-routes-pane" }).addTo(map);
    svgRef.current = svgLayer;

    const svgGroup = d3
      .select(map.getPanes()["d3-routes-pane"])
      .select("svg")
      .selectAll("g.leaflet-zoom-hide")
      .data([null])
      .join("g")
      .attr("class", "leaflet-zoom-hide");

    const baseFeatures = normalizeFeatures(routesArray);

    const preparedLayers = specifications
      .map((spec) => {
        const unitSpec = spec?.unit;
        if (!unitSpec) return null;

        const { formattedEdges, attributeStats } = parseFeaturesToEdges(baseFeatures);
        if (!formattedEdges.length) return null;

        return { unitSpec, formattedEdges, attributeStats };
      })
      .filter(Boolean);

    const redraw = () => {
      svgGroup.selectAll("*").remove();

      for (let layerIndex = 0; layerIndex < preparedLayers.length; layerIndex++) {
        const { unitSpec, formattedEdges, attributeStats } = preparedLayers[layerIndex];

        const dynamicDistance = getOffsetDistance(map);
        const fakeProcessedEdges = {
          edges: formattedEdges,
          attributeStats,
        };

        const layerGroup = svgGroup
          .append("g")
          .attr("class", `leaflet-zoom-hide spec-layer-${layerIndex}`);

        const instructions = buildD3Instructions(
          formattedEdges,
          unitSpec,
          fakeProcessedEdges,
          { attributeStats: fakeProcessedEdges.attributeStats },
          dynamicDistance,
          "none",
          map,
        );

        drawSegments(unitSpec.method, layerGroup, instructions);
      }
    };

    map.on("zoomend moveend viewreset", redraw);
    redraw();

    return () => {
      map.off("zoomend moveend viewreset", redraw);
      if (svgRef.current) map.removeLayer(svgRef.current);
    };
  }, [
    map,
    routesArray,
    specifications,
  ]);

  return null;
}