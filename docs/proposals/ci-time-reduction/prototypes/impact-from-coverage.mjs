#!/usr/bin/env node
// Prototype: coverage-driven Test Impact Analysis (strategy.md §10.5, Layer 4).
//
// Turns per-spec Istanbul coverage into a reverse index
//   sourceFile -> [specs that execute it]
// and, given a set of changed files, outputs the specs to run.
//
// WHERE THE COVERAGE COMES FROM
//   Istanbul/nyc emit `coverage-final.json`, an object keyed by absolute source
//   path: { "<abs>": { path, statementMap, s: { "0": hitCount, ... }, ... } }.
//   A source file is "covered by" a run iff any statement count > 0.
//   Today RC merges all specs into one file per suite (spec identity lost). After
//   the one-line fix in tests/e2e/utils/test.ts (key the snapshot by
//   testInfo.titlePath before merging), each spec yields its own coverage-final,
//   which is what this script consumes: a dir of `<spec>.coverage-final.json`.
//
// USAGE
//   Build the map, then query it:
//     node impact-from-coverage.mjs --map <coverageDir> --out impact-map.json
//     node impact-from-coverage.mjs --query impact-map.json <changedFile> ...
//   Self-contained demo (no files needed):
//     node impact-from-coverage.mjs --demo

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Normalize an absolute istanbul path to a repo-relative one for stable keys.
const rel = (p, root) => path.relative(root, p).replaceAll('\\', '/');

// coverage-final.json -> Set(repo-relative source files with >0 hits)
function coveredFiles(coverageFinal, root) {
  const out = new Set();
  for (const [abs, data] of Object.entries(coverageFinal)) {
    const counts = Object.values(data.s ?? {});
    if (counts.some((c) => c > 0)) out.add(rel(data.path ?? abs, root));
  }
  return out;
}

// Build reverse index: { sourceFile -> [specs] } from a dir of <spec>.coverage-final.json
function buildMap(dir, root) {
  const map = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.coverage-final.json'))) {
    const spec = f.replace(/\.coverage-final\.json$/, '');
    const cov = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
    for (const src of coveredFiles(cov, root)) (map[src] ??= []).push(spec);
  }
  for (const k of Object.keys(map)) map[k].sort();
  return map;
}

// changed files -> specs to run. Unknown files (not in the map) => caller must
// fall back to FULL: coverage can't vouch for a file it has never seen.
function query(map, changed) {
  const specs = new Set();
  const unknown = [];
  for (const f of changed) {
    if (map[f]) map[f].forEach((s) => specs.add(s));
    else unknown.push(f);
  }
  return { specs: [...specs].sort(), unknown, fallbackToFull: unknown.length > 0 };
}

const argv = process.argv.slice(2);
const root = process.cwd();

if (argv.includes('--demo')) {
  // Synthetic per-spec coverage: two specs, each touching different sources.
  const mkCov = (files) =>
    Object.fromEntries(files.map((p) => [p, { path: path.join(root, p), s: { 0: 1 } }]));
  const specCoverage = {
    'apps/apps-modal.spec': mkCov(['packages/apps/base-runtime/src/lib/accessors/http.ts', 'apps/meteor/app/apps/server/orchestrator.ts']),
    'omnichannel/agents.spec': mkCov(['apps/meteor/app/livechat/server/api/agents.ts', 'packages/models/src/models/LivechatAgents.ts']),
  };
  const map = {};
  for (const [spec, cov] of Object.entries(specCoverage))
    for (const src of coveredFiles(cov, root)) (map[src] ??= []).push(spec);

  console.log('reverse index (sourceFile -> specs):');
  console.log(JSON.stringify(map, null, 2));

  const changed = ['packages/apps/base-runtime/src/lib/accessors/http.ts', 'README.md'];
  console.log('\nchanged files:', changed);
  console.log('=> selection:', JSON.stringify(query(map, changed), null, 2));
  console.log('\nNote: README.md is unknown to the map => fallbackToFull=true (safe default).');
  process.exit(0);
}

if (argv.includes('--map')) {
  const dir = argv[argv.indexOf('--map') + 1];
  const map = buildMap(dir, root);
  const outIdx = argv.indexOf('--out');
  const json = JSON.stringify(map, null, 2);
  if (outIdx !== -1) writeFileSync(argv[outIdx + 1], json);
  else console.log(json);
  process.exit(0);
}

if (argv.includes('--query')) {
  const mapFile = argv[argv.indexOf('--query') + 1];
  const map = JSON.parse(readFileSync(mapFile, 'utf8'));
  const changed = argv.slice(argv.indexOf('--query') + 2).filter((a) => !a.startsWith('--'));
  console.log(JSON.stringify(query(map, changed), null, 2));
  process.exit(0);
}

console.error('see header for usage; try --demo');
process.exit(1);
