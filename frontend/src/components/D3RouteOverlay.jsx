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

  const unitSpec = specifications?.length > 0 ? specifications[0].unit : null;

  const routesArray = useSelector((state) => state.Route.routes);

  useEffect(() => {
    if (!map || !routesArray || !unitSpec) return;

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

    // 2. Parse Your Data
    let formattedEdges = [];
    let attributeStats = {};

    const features = routesArray.type === "FeatureCollection" 
      ? routesArray.features 
      : routesArray;

    

    features.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      const edgeAttributes = {
        heat_exposure: feature.properties.heat_exposure,
        humidity_exposure: feature.properties.humidity_exposure,
        rain_exposure: feature.properties.rain_exposure,
        wind_exposure: feature.properties.wind_exposure,
        distance: feature.properties.distance,
        duration: feature.properties.duration,
        repeated: feature.properties.repeated || 1,
        color: feature.properties.color || 1
      };

      // Track min/max stats
      Object.keys(edgeAttributes).forEach((key) => {
        if (typeof edgeAttributes[key] === "number") {
          if (!attributeStats[key]) {
            attributeStats[key] = { min: Infinity, max: -Infinity };
          }
          attributeStats[key].min = Math.min(attributeStats[key].min, edgeAttributes[key]);
          attributeStats[key].max = Math.max(attributeStats[key].max, edgeAttributes[key]);
        }
      });

      // Create segment edges
      for (let i = 0; i < coords.length - 1; i++) {
        formattedEdges.push({
          point0: { lat: coords[i][1], lon: coords[i][0] },
          point1: { lat: coords[i + 1][1], lon: coords[i + 1][0] },
          bearing: 0,
          attributes: edgeAttributes,
        });
      }
    });

    const fakeProcessedEdges = {
      edges: formattedEdges,
      attributeStats: attributeStats,
    };

    // 3. Define the Redraw Function
    const redraw = () => {
      svgGroup.selectAll("*").remove();

      const dynamicDistance = getOffsetDistance(map) * 0;

      const instructions = buildD3Instructions(
        formattedEdges,
        unitSpec,
        fakeProcessedEdges,
        { attributeStats: fakeProcessedEdges.attributeStats },
        dynamicDistance,
        "none",
        map,
      );

      drawSegments(unitSpec.method, svgGroup, instructions);
    };

    map.on("zoomend moveend viewreset", redraw);
    redraw();

    return () => {
      map.off("zoomend moveend viewreset", redraw);
      if (svgRef.current) map.removeLayer(svgRef.current);
    };
  }, [map, routesArray, unitSpec]);

  return null;
}