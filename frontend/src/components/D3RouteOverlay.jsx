import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as d3 from "d3";
import L from "leaflet";
// Assuming you copied these files into your project
import {
  buildD3Instructions,
  drawSegments,
} from "../utils/streetweave_renderer/d3Helpers";
import { getOffsetDistance } from "../utils/streetweave_renderer/mapHelpers";

import { useSelector } from "react-redux";

export default function D3RouteOverlay({ routesArray }) {
  const map = useMap();
  const svgRef = useRef(null);

  const specifications = useSelector(
    (state) => state.Specification.specifications,
  );

  const unitSpec = specifications?.length > 0 ? specifications[0].unit : null;


  console.log("D3RouteOverlay received routesArray:", routesArray);
  console.log("D3RouteOverlay received unitSpec:", unitSpec);

  useEffect(() => {
    if (!map || !routesArray || !unitSpec) return;

    // 1. Setup Layer
    if (!map.getPane("d3-routes-pane")) {
      map.createPane("d3-routes-pane");
      map.getPane("d3-routes-pane").style.zIndex = 450;
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

    // 2. Parse Your Data to Match Streetweave's PhysicalEdge[] Format
    let formattedEdges = [];
    
    // We will build a dynamic dictionary of stats for all properties
    let attributeStats = {}; 

    routesArray.forEach((route) => {
      const coords = route.coordinates;
      
      const edgeAttributes = {
        heat_exposure: route.heat_exposure,
        distance: route.distance,
        duration: route.duration,
      };

      // Dynamically track min/max for EVERY numeric property
      Object.keys(edgeAttributes).forEach((key) => {
        if (typeof edgeAttributes[key] === 'number') {
          if (!attributeStats[key]) {
            attributeStats[key] = { min: Infinity, max: -Infinity };
          }
          if (edgeAttributes[key] < attributeStats[key].min) {
            attributeStats[key].min = edgeAttributes[key];
          }
          if (edgeAttributes[key] > attributeStats[key].max) {
            attributeStats[key].max = edgeAttributes[key];
          }
        }
      });

      // Loop over coordinates to create segment-by-segment edges
      for (let i = 0; i < coords.length - 1; i++) {
        formattedEdges.push({
          point0: { lat: coords[i][0], lon: coords[i][1] },
          point1: { lat: coords[i + 1][0], lon: coords[i + 1][1] },
          bearing: 0, 
          attributes: edgeAttributes,
        });
      }
    });

    // Provide the required structure for getDynamicStyleValue
    const fakeProcessedEdges = {
      edges: formattedEdges,
      attributeStats: attributeStats // Passes the dynmically generated stats
    };

    // 3. Define the Redraw Function
    const redraw = () => {
      svgGroup.selectAll("*").remove();

      // Ensure your copied getOffsetDistance handles alignment (left vs right)
      const dynamicDistance = getOffsetDistance(map) * 0; // offset count if aligning multiple lines

      // buildD3Instructions uses styleHelpers internally to apply unitSpec to your edges!
      const instructions = buildD3Instructions(
        formattedEdges,
        unitSpec,
        fakeProcessedEdges,
        { attributeStats: fakeProcessedEdges.attributeStats },
        dynamicDistance,
        "none", // relationType
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
