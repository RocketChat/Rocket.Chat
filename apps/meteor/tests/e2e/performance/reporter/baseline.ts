import * as fs from 'fs';
import * as path from 'path';

import { test } from '@playwright/test';

const BASELINES_DIR = path.join(__dirname, 'baselines');

// Adaptive threshold tiers based on the baseline value:
// - fast tests (<200ms): wider tolerance for measurement noise
// - medium tests (200ms–2s): standard tolerance
// - slow journeys (>2s): tighter tolerance for stable, well-sampled flows
function getThreshold(baselineMs: number): number {
	if (baselineMs < 200) return 0.3;
	if (baselineMs < 2000) return 0.2;
	return 0.1;
}

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function baselinePath(suite: string): string {
	return path.join(BASELINES_DIR, `${suite.replace(/[^a-z0-9-_]/gi, '_')}.json`);
}

export function loadBaseline(suite: string): Record<string, number> {
	const file = baselinePath(suite);
	if (!fs.existsSync(file)) return {};
	try {
		return JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, number>;
	} catch {
		return {};
	}
}

export function saveBaseline(suite: string, metrics: Record<string, number>): void {
	fs.mkdirSync(BASELINES_DIR, { recursive: true });
	const file = baselinePath(suite);

	if (process.env.UPDATE_PERF_BASELINES !== 'true' && fs.existsSync(file)) {
		return;
	}

	fs.writeFileSync(file, JSON.stringify(metrics, null, 2));
}

/**
 * When CI shards tests across multiple runners, each shard writes its own partial
 * results. Set PERF_SHARD_RESULTS_DIR to a directory containing per-shard JSON
 * files and call this before assertWithinBaseline to merge them into a single
 * "current run" snapshot. The median across shards is used for comparison.
 */
export function mergeShardResults(suite: string, currentValue: number): number {
	const shardDir = process.env.PERF_SHARD_RESULTS_DIR;
	if (!shardDir) return currentValue;

	const values: number[] = [currentValue];

	try {
		for (const file of fs.readdirSync(shardDir)) {
			if (!file.endsWith('.json')) continue;
			const data = JSON.parse(fs.readFileSync(path.join(shardDir, file), 'utf-8')) as Record<string, number>;
			if (suite in data && typeof data[suite] === 'number') {
				values.push(data[suite]);
			}
		}
	} catch {
		// shard dir not available — use the current value only
	}

	return median(values);
}

export function assertWithinBaseline(suite: string, metricName: string, value: number, baseline?: Record<string, number>): void {
	const bl = baseline ?? loadBaseline(suite);
	const baselineValue = bl[metricName];

	if (baselineValue === undefined) {
		// No baseline yet — save this run as the new baseline
		saveBaseline(suite, { ...bl, [metricName]: value });
		return;
	}

	const threshold = getThreshold(baselineValue);
	const allowedMax = baselineValue * (1 + threshold);
	const mergedValue = mergeShardResults(`${suite}.${metricName}`, value);

	if (mergedValue > allowedMax) {
		const tracePath = path.join('tests', 'e2e', '.playwright', 'traces', `${test.info().title.replace(/\s+/g, '-')}.zip`);
		throw new Error(
			`Performance regression: "${metricName}" is ${mergedValue.toFixed(1)} ` +
				`(baseline: ${baselineValue.toFixed(1)}, ` +
				`allowed max: ${allowedMax.toFixed(1)}, ` +
				`threshold: ${(threshold * 100).toFixed(0)}%)\n` +
				`[View Trace](${tracePath})`,
		);
	}
}
