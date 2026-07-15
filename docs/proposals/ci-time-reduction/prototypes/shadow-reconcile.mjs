#!/usr/bin/env node
// Prototype: shadow-mode reconciliation + flake classification (strategy.md §10.2).
//
// Answers "is judging real-vs-flake a manual step?" — No. It is automated from
// signals already produced in CI:
//
//  1. SAME-RUN RETRY (already configured: PLAYWRIGHT_RETRIES). Playwright marks a
//     test that fails then passes on retry as status "flaky". A test whose final
//     status is "failed"/"timedOut" is a REAL failure. This is in the Playwright
//     JSON report (`--reporter=json`).
//  2. ROLLING FLAKE REGISTRY. RC already ships history to external reporters
//     (tests/e2e/reporters/rocketchat.ts, jira.ts, playwright-qase-reporter).
//     Aggregate the trailing N develop runs into a set of chronically-flaky test
//     titles; discount those even on a hard failure.
//
// Shadow reconciliation logic: for each job the classifier WOULD skip, if that
// job produced a REAL (non-flake) failure, the mapping is unsafe -> widen it.
// Only a brand-new hard failure on a would-skip job (not in the registry, not a
// retry-flake) needs a human glance — and that is exactly the signal we want.
//
// USAGE
//   node shadow-reconcile.mjs --report <playwright.json> --registry <flaky.json> \
//        --would-skip <jobName>
//   node shadow-reconcile.mjs --demo

import { readFileSync } from 'node:fs';

// Flatten a Playwright JSON report into { title, status, wouldSkipJob }.
// Playwright status per test: 'expected' | 'unexpected' | 'flaky' | 'skipped'.
function flatten(report) {
  const out = [];
  const walk = (suite, trail) => {
    for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        out.push({ title: [...trail, spec.title].join(' › '), status: test.status });
      }
    }
  };
  for (const s of report.suites ?? []) walk(s, [s.title]);
  return out;
}

// A "real" failure = final status unexpected/failed AND not a known flake.
function classify(tests, registry) {
  const flakySet = new Set(registry?.flakyTitles ?? []);
  const realFailures = [];
  const flakes = [];
  for (const t of tests) {
    if (t.status === 'flaky') flakes.push({ ...t, reason: 'passed-on-retry' });
    else if (t.status === 'unexpected' || t.status === 'failed' || t.status === 'timedOut') {
      if (flakySet.has(t.title)) flakes.push({ ...t, reason: 'in-flake-registry' });
      else realFailures.push(t);
    }
  }
  return { realFailures, flakes };
}

const argv = process.argv.slice(2);

if (argv.includes('--demo')) {
  // Synthetic Playwright report: one real fail, one retry-flake, one registry-flake, one pass.
  const report = {
    suites: [
      {
        title: 'apps',
        specs: [
          { title: 'installs a private app', tests: [{ status: 'unexpected' }] }, // real
          { title: 'opens uikit modal', tests: [{ status: 'flaky' }] }, // retry-flake
          { title: 'contextualbar renders', tests: [{ status: 'unexpected' }] }, // registry-flake
          { title: 'lists marketplace', tests: [{ status: 'expected' }] }, // pass
        ],
      },
    ],
  };
  const registry = { flakyTitles: ['apps › contextualbar renders'] };
  const wouldSkipJob = 'test-ui (apps)'; // classifier would have skipped this job
  const tests = flatten(report);
  const { realFailures, flakes } = classify(tests, registry);

  console.log(`would-skip job: ${wouldSkipJob}`);
  console.log('flakes (auto-discounted):', flakes.map((f) => `${f.title} [${f.reason}]`));
  console.log('REAL failures on a would-skip job:', realFailures.map((f) => f.title));
  const verdict = realFailures.length
    ? 'UNSAFE — a real failure would have been skipped; widen the mapping for this job'
    : 'safe — only flakes; mapping holds';
  console.log('verdict:', verdict);
  console.log('\n(Fully automated: exit non-zero on real failures to fail the shadow reconciliation.)');
  process.exit(0);
}

const report = JSON.parse(readFileSync(argv[argv.indexOf('--report') + 1], 'utf8'));
const registry = argv.includes('--registry')
  ? JSON.parse(readFileSync(argv[argv.indexOf('--registry') + 1], 'utf8'))
  : { flakyTitles: [] };
const { realFailures, flakes } = classify(flatten(report), registry);
console.log(JSON.stringify({ realFailures, flakeCount: flakes.length }, null, 2));
process.exit(realFailures.length ? 1 : 0);
