import type { InboundStats } from '../src/metrics';

export type { InboundStats };

const sumOf = (values: Record<string, number>, keys: string[]): number => keys.reduce((sum, key) => sum + (values[key] ?? 0), 0);

export const decodedOf = (stats: InboundStats, keys: string[]): number => sumOf(stats.decoded, keys);

export const inflightOf = (stats: InboundStats, keys: string[]): number => sumOf(stats.inflight, keys);

export const failedOf = (stats: InboundStats, keys: string[]): number => sumOf(stats.failed, keys);

/** Events the service is done with; in decode-only mode decoding is all it does. */
export const processedOf = (stats: InboundStats, keys: string[], decodeOnly: boolean): number =>
	decodeOnly ? decodedOf(stats, keys) : sumOf(stats.completed, keys) + sumOf(stats.failed, keys);

export async function fetchStats(serviceUrl: string): Promise<InboundStats> {
	const res = await fetch(`${serviceUrl}/stats`, { signal: AbortSignal.timeout(5000) });
	if (!res.ok) {
		throw new Error(`${serviceUrl}/stats → HTTP ${res.status}`);
	}
	return (await res.json()) as InboundStats;
}

/** Handler-duration percentile over the window between two samples, as the upper bound of the bucket it falls in. */
export function durationPercentileMs(before: InboundStats, after: InboundStats, keys: string[], percentile: number): number | undefined {
	let le: number[] | undefined;
	let counts: number[] | undefined;
	let total = 0;
	for (const key of keys) {
		const end = after.durations[key];
		if (!end) {
			continue;
		}
		const start = before.durations[key];
		le ??= end.le;
		counts ??= end.le.map(() => 0);
		for (let i = 0; i < end.counts.length; i++) {
			counts[i] += end.counts[i] - (start?.counts[i] ?? 0);
		}
		total += end.total - (start?.total ?? 0);
	}
	if (!le || !counts || total === 0) {
		return undefined;
	}
	const index = counts.findIndex((cumulative) => cumulative >= total * percentile);
	// Past the last finite bucket the true value is unbounded; report the bound as a floor
	return (index === -1 ? le[le.length - 1] : le[index]) * 1000;
}
