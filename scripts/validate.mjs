#!/usr/bin/env node
// Validates every program config under programs/ against its JSON Schema.
//
// Files are routed to a schema by filename suffix — the same convention the app's
// ProgramCatalog.bundled(in:) uses to decode them:
//   <id>.earning.json    → earning.schema.json
//   <id>.milestones.json → milestones.schema.json
//   *.links.json         → links.schema.json
//   vat-rates.json       → vat-rates.schema.json
//   service-rates.json   → service-rates.schema.json
//   everything else      → program.schema.json
//
// This is the structural gate for contributor PRs (run in CI). Cross-reference
// integrity (do referenced metric/tier ids resolve?) is enforced separately by the
// Swift CatalogIntegrityTests.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here); // rulebook/
const programsDir = join(root, "programs");
const schemaDir = join(root, "schema");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function loadSchema(name) {
  return JSON.parse(readFileSync(join(schemaDir, name), "utf8"));
}

const validators = {
  program: ajv.compile(loadSchema("program.schema.json")),
  earning: ajv.compile(loadSchema("earning.schema.json")),
  milestones: ajv.compile(loadSchema("milestones.schema.json")),
  links: ajv.compile(loadSchema("links.schema.json")),
  vat: ajv.compile(loadSchema("vat-rates.schema.json")),
  service: ajv.compile(loadSchema("service-rates.schema.json")),
};

function validatorFor(file) {
  if (file === "vat-rates.json") return ["vat", validators.vat];
  if (file === "service-rates.json") return ["service", validators.service];
  if (file.endsWith(".earning.json")) return ["earning", validators.earning];
  if (file.endsWith(".milestones.json")) return ["milestones", validators.milestones];
  if (file.endsWith(".links.json")) return ["links", validators.links];
  return ["program", validators.program];
}

const files = readdirSync(programsDir).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.error(`No .json files found in ${programsDir}`);
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  const [kind, validate] = validatorFor(file);
  let data;
  try {
    data = JSON.parse(readFileSync(join(programsDir, file), "utf8"));
  } catch (e) {
    console.error(`✗ ${file}: invalid JSON — ${e.message}`);
    failures++;
    continue;
  }
  if (validate(data)) {
    console.log(`✓ ${basename(file)} (${kind})`);
  } else {
    failures++;
    console.error(`✗ ${file} (${kind}):`);
    for (const err of validate.errors) {
      console.error(`    ${err.instancePath || "/"} ${err.message}`);
    }
  }
}

console.log(`\n${files.length - failures}/${files.length} files valid.`);
if (failures > 0) {
  console.error(`${failures} file(s) failed schema validation.`);
  process.exit(1);
}
