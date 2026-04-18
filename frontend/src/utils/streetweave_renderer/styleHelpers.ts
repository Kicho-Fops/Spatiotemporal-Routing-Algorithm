// src/utils/styleHelpers.ts

import * as d3 from 'd3';
import L from 'leaflet'; // Import L for L.Point
import { ParsedSpec } from 'streetweave';

/**
 * Applies opacity based on the type (fill, stroke, line) and layer specification.
 * @param type The type of opacity to apply ('fill', 'stroke', 'line').
 * @param layerSpec The parsed specification for the layer.
 * @returns The opacity value.
 */
export const applyOpacity = (type: 'fill' | 'stroke' | 'line', layerSpec: ParsedSpec): number => {
  switch (type) {
    case 'line':
      return typeof layerSpec.unit.opacity === 'number' ? layerSpec.unit.opacity : 1;
    case 'fill':
      return typeof layerSpec.unit.opacity === 'number' ? layerSpec.unit.opacity : 0.7;
    case 'stroke':
      return typeof layerSpec.unit.opacity === 'number' ? layerSpec.unit.opacity : 1;
    default:
      return 1;
  }
};

/**
 * Computes a style value (color, width, opacity, height) for a segment/node based on layer spec and data.
 * Handles both fixed values and attribute-mapped values.
 * @param specValue The value from the layer spec (e.g., `layerSpec.lineColor`, `layerSpec.lineStrokeWidth`).
 * @param dataPoint The current data point (segment or node) with aggregated attributes.
 * @param allDataPoints All processed data points (for min/max domain calculation).
 * @param d3ScaleRange The D3 scale range for attribute mapping (e.g., [0, 10] for width, [0, 1] for opacity).
 * @param interpolateFn A D3 interpolation function for color scales (e.g., d3.interpolateBuGn).
 * @param thresholdColors An array of colors for threshold scales.
 * @param thresholdSteps The number of steps for threshold scales (default: 5).
 * @returns The computed style value.
 */
export const getDynamicStyleValue = (
  name: string | number | undefined,
  attributes: Record<string, number | undefined> | undefined,
  domain: Record<string, { min: number; max: number }> | undefined,
  range: any | undefined
  // d3ScaleRange: [number, number] | null = null,
  // interpolateFn: ((t: number) => string) | null = null,
  // thresholdColors: string[] | null = null,
  // thresholdSteps: number = 5
): string | number | undefined => {
  // console.log("checking color thing", attributes)
  // console.log(specValue, dataPoint, allDataPoints, d3ScaleRange, interpolateFn, thresholdColors, thresholdSteps);

  const hexRe = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  if (typeof name === 'number') {
    return name;
  }
  if (typeof name === 'string' && hexRe.test(name)) {
    return name;
  }
  else if(typeof name === 'string' && attributes && name in attributes && domain) {
    // console.log("here check attributes", attributes)
    // console.log("here check domain", domain)
    let scale;
    if(range){
      // console.log("range is", range);
      // console.log("min is", domain[name].min);
      // console.log("max is", domain[name].max);
      scale = d3.scaleLinear().domain([domain[name].min, domain[name].max]).range(range);
    }
    else
      scale = d3.scaleLinear().domain([domain[name].min, domain[name].max]);
    if(attributes[name] != undefined)
      return scale(attributes[name]);
    else
      return undefined;
  }

  return undefined; // Default if attribute not found or no mapping specified
};

/**
 * Computes dash array for a dashed line based on an attribute value.
 * @param lineType The line type from layer spec.
 * @param lineTypeVal The attribute name for dash array.
 * @param segment The current segment.
 * @param allSegments All processed segments.
 * @returns The dash array string or null.
 */
export const getDashArray = (
  name: string | number | undefined,
  attributes: Record<string, number | undefined> | undefined,
  domain: Record<string, { min: number; max: number }> | undefined
): string => {
  if (name && domain) {
    const aggregatedAttributes = attributes;
    if (aggregatedAttributes && aggregatedAttributes.hasOwnProperty(name)) {
      const attributeValue = aggregatedAttributes[name];
      if (attributeValue === null || typeof attributeValue === 'undefined') return "";

      const minValue = domain[name].min; // d3.min(allAttributeValues);
      const maxValue = domain[name].max; // d3.max(allAttributeValues);

      if (attributeValue < minValue + (maxValue - minValue) / 3) {
        return "5, 3";
      } else if (
        attributeValue >= minValue + (maxValue - minValue) / 3 &&
        attributeValue < minValue + (2 * (maxValue - minValue)) / 3
      ) {
        return "7, 5";
      } else {
        return "12, 8";
      }
    }
  }
  return "";
};

export function getBivariateColor(val1: number, val2: number): string {
  const colorInterpolator1 = d3.interpolateBuGn; // From green to blue
  const colorInterpolator2 = d3.interpolateOrRd; // From orange to red

  const color1 = d3.color(colorInterpolator1(val1)) as d3.RGBColor;
  const color2 = d3.color(colorInterpolator2(val2)) as d3.RGBColor;

  if (!color1 || !color2) { // Handle potential null colors if interpolators return null
      return "gray";
  }

  // Blend the two colors. Example: average RGB components
  const blendedR = (color1.r + color2.r) / 2;
  const blendedG = (color1.g + color2.g) / 2;
  const blendedB = (color1.b + color2.b) / 2;

  return `rgb(${Math.round(blendedR)}, ${Math.round(blendedG)}, ${Math.round(blendedB)})`;
  // return `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
}

/**
 * Computes squiggle amplitude and frequency based on an attribute value.
 * @param lineType The line type.
 * @param lineTypeVal The attribute name for squiggle.
 * @param segment The current segment.
 * @param allSegments All processed segments.
 * @returns An object with amplitude and frequency.
 */
export const getSquiggleParams = (
  name: string | number | undefined,
  attributes: Record<string, number | undefined> | undefined,
  domain: Record<string, { min: number; max: number }> | undefined
  // lineType: string | undefined,
  // lineTypeVal: string | undefined,
  // segment: PhysicalEdge,
  // allSegments: PhysicalEdge[]
): { amplitude: number; frequency: number } => {

  if (name && domain) {
    const aggregatedAttributes = attributes;
    if (aggregatedAttributes && aggregatedAttributes.hasOwnProperty(name)) {
      const attributeValue = aggregatedAttributes[name];
      if(attributeValue != undefined){
        const min = domain[name].min;
        const max = domain[name].max;
        const range = max - min;
        const stepSize = range / 4;
        const boundary1 = min + stepSize;
        const boundary2 = min + 2 * stepSize;
        const boundary3 = min + 3 * stepSize;

        let frequency: number;
        if (attributeValue >= min && attributeValue < boundary1) {
          frequency = 5;
        } else if (attributeValue >= boundary1 && attributeValue < boundary2) {
          frequency = 20;
        }
        else if (attributeValue >= boundary2 && attributeValue < boundary3) {
          frequency = 40;
        } else {
          frequency = 60;
        }
        const amplitude = 25;
        console.log("freq is", frequency)
        return { amplitude, frequency };
        // return { amplitude: d3.scaleLinear().domain([domain[name].min, domain[name].max]).range([22,])(attributeValue), frequency: d3.scaleLinear().domain([domain[name].min, domain[name].max]).range([5, 20, 60])(attributeValue) };
      }

    }
  }
  
  return { amplitude: 0, frequency: 1 };
  // return { amplitude: squiggleAmplitude, frequency: squiggleFrequency };
};

/**
 * Generates a simple wavy SVG path between two points.
 * @param start Start point [x, y].
 * @param end End point [x, y].
 * @param amplitude Amplitude of the wave.
 * @param wavelength Wavelength of the wave.
 * @returns The SVG path string.
 */
export function generateSimpleWavyPath(start: L.Point, end: L.Point, amplitude: number, wavelength: number): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const numWaves = Math.ceil(distance / wavelength);

  let path = `M ${start.x},${start.y} `;

  for (let i = 0; i < numWaves; i++) {
    const t = (i + 0.5) / numWaves;

    const xMid = start.x + t * dx;
    const yMid = start.y + t * dy;

    const offsetX = amplitude * Math.sin((i + 0.5) * Math.PI);
    const controlX = xMid + offsetX * Math.cos(angle + Math.PI / 2);
    const controlY = yMid + offsetX * Math.sin(angle + Math.PI / 2);

    const xNext = start.x + ((i + 1) / numWaves) * dx;
    const yNext = start.y + ((i + 1) / numWaves) * dy;

    path += `Q ${controlX},${controlY} ${xNext},${yNext} `;
  }
  return path;
}

/**
 * Generates an SVG spike path.
 * @param length Length of the spike.
 * @param width Base width of the spike.
 * @returns The SVG path string.
 */
export function spikePath(length: number, width: number): string {
  return `M${-width / 2},0 L0,${-length} L${width / 2},0 Z`;
}

/**
 * Generates an SVG rectangle path.
 * @param length Length of the rectangle.
 * @param width Width of the rectangle.
 * @returns The SVG path string.
 */
export function rectPath(length: number, width: number): string {
  return `M${-width / 2},0 L${-width / 2},${-length} L${width / 2},${-length} L${width / 2},0 Z`;
}

// Colors for the example based on index for perpendicular rectangles
export const PERPENDICULAR_COLORS = [
  ["#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"], // Index 0 (NoSidewalk)
  ["#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#034e7b"]  // Index 1 (Obstacle)
];