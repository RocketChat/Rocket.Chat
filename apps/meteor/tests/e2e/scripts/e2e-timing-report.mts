/*
 * Phase 3 timing guardrail: summarise per-spec p50 durations from a
 * Playwright JSON report and flag files whose median test time exceeds
 * the project's p50 < 3s/test target.
 *
 * Run with:
 *   node --experimental-strip-types apps/meteor/tests/e2e/scripts/e2e-timing-report.mts <path/to/results.json> [threshold_ms]
 *
 * Produces a markdown summary on stdout (suitable for $GITHUB_STEP_SUMMARY).
 * Default threshold is 3000ms per the plan.
 */

import { readFileSync } from 'node:fs';

type PlaywrightTest = {
	title: string;
	results: { duration: number; status: string }[];
};

type PlaywrightSpec = {
	file: string;
	tests: PlaywrightTest[];
	suites?: PlaywrightSuite[];
};

type PlaywrightSuite = {
	file?: string;
	specs?: PlaywrightSpec[];
	suites?: PlaywrightSuite[];
};

type PlaywrightReport = {
	config: unknown;
	suites: PlaywrightSuite[];
};

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function* walkSpecs(suites: PlaywrightSuite[] | undefined): Generator<PlaywrightSpec> {
	if (!suites) return;
	for (const s of suites) {
		if (s.specs) {
			for (const spec of s.specs) {
				yield { ...spec, file: spec.file || s.file || '' };
			}
		}
		yield* walkSpecs(s.suites);
	}
}

function main(): void {
	const [reportPath, thresholdArg] = process.argv.slice(2);
	if (!reportPath) {
		console.error('Usage: e2e-timing-report.mts <results.json> [threshold_ms]');
		process.exit(2);
	}

	const threshold = thresholdArg ? Number(thresholdArg) : 3000;
	const raw = readFileSync(reportPath, 'utf8');
	const report: PlaywrightReport = JSON.parse(raw);

	type Row = { file: string; tests: number; p50: number; total: number };
	const byFile = new Map<string, number[]>();

	for (const spec of walkSpecs(report.suites)) {
		for (const t of spec.tests) {
			// Use the last attempt's duration (retry-adjusted). Skip skipped/flaky statuses.
			const last = t.results[t.results.length - 1];
			if (!last || last.status === 'skipped') continue;
			const list = byFile.get(spec.file) ?? [];
			list.push(last.duration);
			byFile.set(spec.file, list);
		}
	}

	const rows: Row[] = Array.from(byFile.entries())
		.map(([file, durations]) => ({
			file,
			tests: durations.length,
			p50: median(durations),
			total: durations.reduce((a, b) => a + b, 0),
		}))
		.filter((r) => r.p50 > threshold)
		.sort((a, b) => b.p50 - a.p50);

	console.log(`# E2E p50 > ${threshold}ms\n`);
	if (rows.length === 0) {
		console.log(`All ${byFile.size} spec files are under the ${threshold}ms median target. 🎯\n`);
		return;
	}
	console.log(`${rows.length} of ${byFile.size} spec files exceed the p50 < ${threshold}ms/test target.\n`);
	console.log('| spec | tests | p50 (ms) | total (ms) |');
	console.log('| --- | --: | --: | --: |');
	for (const r of rows) {
		console.log(`| \`${r.file}\` | ${r.tests} | ${r.p50} | ${r.total} |`);
	}
	console.log('');
	console.log('Recurring offenders are Phase 2 candidates for `docs/proposals/e2e-performance-migration.md`.');
}

main();
