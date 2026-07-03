// parser.ts
import { ParsedSpec } from './types';
import Ajv from 'ajv';
import addFormats from "ajv-formats";
import parsedSpecSchema from './schema.json';
import { default as vegaLiteSchemaV5 } from 'vega-lite/build/vega-lite-schema.json';

const ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });
addFormats(ajv);
ajv.addFormat("color-hex", (data: string) => {
  // Basic regex for #RRGGBB or #RGB hex colors
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data);
});
const VEGA_LITE_SCHEMA_ID = "https://vega.github.io/schema/vega-lite/v5.json";

try {
  ajv.addSchema(vegaLiteSchemaV5, VEGA_LITE_SCHEMA_ID);
  console.log(`Vega-Lite Schema (${VEGA_LITE_SCHEMA_ID}) added to AJV successfully.`);
} catch (addSchemaError) {
  console.error('Failed to add Vega-Lite schema to AJV:', addSchemaError);
  throw new Error('Failed to configure AJV with Vega-Lite schema.');
}

let validate: any;
try {
  validate = ajv.compile(parsedSpecSchema);
  console.log('Main Schema compiled successfully.');
} catch (compileError) {
  console.error('Main Schema compilation failed:', compileError);
  throw new Error('Failed to compile JSON schema.');
}

export function parseSpecification(specJson: string): ParsedSpec[] {
  const trimmed = specJson.trim();
  const parsedResults: ParsedSpec[] = [];

  const tryParseBlock = (block: string) => {
    const parsed = JSON.parse(block);
    const layerSpecs = Array.isArray(parsed) ? parsed : [parsed];

    const isValidTopLevel = validate(layerSpecs);
    if (!isValidTopLevel) {
      console.error("Top-level JSON schema validation errors:", validate.errors);
      return;
    }

    parsedResults.push(...layerSpecs);
  };

  try {
    // First try: one valid JSON value
    tryParseBlock(trimmed);
    return parsedResults;
  } catch {
    // Fallback: multiple JSON blocks separated by blank lines
    const blocks = trimmed.split(/\n\s*\n+/).filter(Boolean);

    for (const block of blocks) {
      try {
        tryParseBlock(block);
      } catch (err) {
        console.error("Invalid JSON block:", err);
      }
    }

    return parsedResults;
  }
}