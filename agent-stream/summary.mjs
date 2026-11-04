#!/usr/bin/env node
// Turns the JSON results of a matrix into the report tables: the median of the runs of each cell, one table per
// deployment, then the correctness counts summed over the runs.
// usage: node summary.mjs <results dir> [--label h0]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args, positionals } = parseArgs({ allowPositionals: true, options: { label: { type: 'string' } } });
const dir = positionals[0];
const results = readdirSync(dir)
	.filter((file) => file.endsWith('.json'))
	.map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')))
	.filter((r) => r.deployment && (!args.label || r.label === args.label));

const median = (values) => {
	const sorted = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)).sort((a, b) => a - b);
	if (!sorted.length) {
		return null;
	}
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const fmt = (value, digits = 1) => (value === null || value === undefined ? '-' : Number(value).toFixed(digits));
const perInstance = (runs, pick, digits = 1) => {
	const count = Math.max(...runs.map((r) => pick(r).length));
	return Array.from({ length: count }, (_, i) => fmt(median(runs.map((r) => pick(r)[i])), digits)).join(' / ');
};

const cells = new Map();
for (const r of results) {
	const key = `${r.deployment}|${r.scenario}|${r.w}`;
	cells.set(key, [...(cells.get(key) ?? []), r]);
}
const sortedKeys = [...cells.keys()].sort((a, b) => {
	const [da, sa, wa] = a.split('|');
	const [db, sb, wb] = b.split('|');
	return da.localeCompare(db) || sa.localeCompare(sb) || Number(wa) - Number(wb);
});

for (const deployment of [...new Set(results.map((r) => r.deployment))].sort()) {
	const keys = sortedKeys.filter((key) => key.startsWith(`${deployment}|`));
	// a 5 s probe can catch a cron job or a GC, so the net CPU subtracts the median idle rate of all runs of the deployment
	const deploymentRuns = results.filter((r) => r.deployment === deployment && r.server.idleCpuMsPerSec);
	const idleRate = deploymentRuns[0]?.server.idleCpuMsPerSec.map((_, i) => median(deploymentRuns.map((r) => r.server.idleCpuMsPerSec[i])));
	const netCpuMs = (r) => (idleRate ? r.server.cpuMs - idleRate.reduce((sum, rate) => sum + rate, 0) * (r.windowMs / 1000) : null);
	console.log(`\n### ${deployment}\n`);
	console.log(
		`Median idle CPU of the deployment, subtracted for the net columns: ${idleRate?.map((rate) => fmt(rate, 1)).join(' / ')} ms/s per instance.\n`,
	);
	console.log(
		'| Scenario | W | Runs | CPU ms / delivered delta | Net CPU ms / delivered delta | Net CPU ms / reply | Idle CPU ms/s in the run probe (per instance) | CPU % (per instance) | EL p99 ms (per instance) | RSS MB (per instance) | Heap MB (per instance) | Mongo reads / reply | Mongo writes / reply | Mongo commands / reply | Broker events / reply | Broker KB / reply | KB / viewer / reply | Latency p50 / p95 / p99 ms | Delivered / expected | Window s | Timed out |',
	);
	console.log(
		'| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |',
	);
	for (const key of keys) {
		const runs = cells.get(key);
		const [, scenario, w] = key.split('|');
		const m = (pick) => median(runs.map(pick));
		const idle = scenario === 'S4';
		const expected = m((r) => r.expectedDeltasPerViewer * r.viewers);
		console.log(
			[
				scenario,
				idle ? '-' : w,
				runs.length,
				fmt(
					m((r) => r.server.cpuMsPerDeliveredDelta),
					3,
				),
				fmt(
					m((r) => (r.delivered ? netCpuMs(r) / r.delivered : null)),
					3,
				),
				fmt(
					m((r) => (r.replies ? netCpuMs(r) / r.replies : null)),
					0,
				),
				perInstance(runs, (r) => r.server.idleCpuMsPerSec ?? []),
				perInstance(runs, (r) => r.server.cpuPct),
				perInstance(runs, (r) => r.server.eventLoopP99Ms),
				perInstance(runs, (r) => r.server.rssBytes.map((b) => b / 2 ** 20), 0),
				perInstance(runs, (r) => r.server.heapUsedBytes.map((b) => b / 2 ** 20), 0),
				`${fmt(
					m((r) => r.mongo.readsPerReply),
					0,
				)} (${fmt(
					m((r) => r.mongo.netReadsPerReply),
					0,
				)})`,
				`${fmt(
					m((r) => r.mongo.writesPerReply),
					0,
				)} (${fmt(
					m((r) => r.mongo.netWritesPerReply),
					0,
				)})`,
				fmt(
					m((r) => r.mongo.commandsPerReply),
					0,
				),
				fmt(
					m((r) => r.broker.eventsPerReply),
					0,
				),
				fmt(
					m((r) => r.broker.bytesPerReply && r.broker.bytesPerReply / 1024),
					0,
				),
				fmt(
					m((r) => r.bytesPerViewerPerReply.mean / 1024),
					1,
				),
				idle
					? '-'
					: `${fmt(
							m((r) => r.latencyMs.p50),
							0,
						)} / ${fmt(
							m((r) => r.latencyMs.p95),
							0,
						)} / ${fmt(
							m((r) => r.latencyMs.p99),
							0,
						)}`,
				idle
					? '-'
					: `${fmt(
							m((r) => r.delivered),
							0,
						)} / ${fmt(expected, 0)}`,
				fmt(
					m((r) => r.windowMs / 1000),
					1,
				),
				runs.filter((r) => r.timedOut).length,
			]
				.join(' | ')
				.replace(/^/, '| ')
				.replace(/$/, ' |'),
		);
	}

	const idleRuns = cells.get(`${deployment}|S4|0`);
	if (idleRuns) {
		const m = (pick) => median(idleRuns.map(pick));
		const seconds = m((r) => r.windowMs / 1000);
		const ops = (r) => Object.values(r.mongo.db).reduce((a, b) => a + b, 0);
		console.log(
			`\nS4 standing cost (${idleRuns[0].viewers} idle viewers): CPU ${fmt(m((r) => r.server.cpuMs) / seconds, 1)} ms/s in total, ` +
				`heap ${fmt(m((r) => r.server.memoryPerConnection.heapUsedBytes) / 1024, 1)} KB and RSS ${fmt(m((r) => r.server.memoryPerConnection.rssBytes) / 1024, 1)} KB per connection, ` +
				`Mongo ${fmt(m(ops) / seconds, 1)} ops/s, broker ${fmt(m((r) => r.broker.perInstance.reduce((a, i) => a + i.events, 0)) / seconds, 2)} events/s, ` +
				`${fmt(
					m((r) => r.bytesPerViewerPerReply.mean),
					0,
				)} bytes per viewer in ${fmt(seconds, 0)} s.`,
		);
	}
}

console.log('\n### Correctness (sum over the runs of each cell)\n');
console.log(
	'| Deployment | Scenario | W | Runs | Gap events | Missing seqs | Duplicates | Out of order | Stale after snapshot | Reconnects | Errors | Not ended | Text mismatch | Persisted not done |',
);
console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const key of sortedKeys) {
	const runs = cells.get(key);
	const [deployment, scenario, w] = key.split('|');
	const total = (field) => runs.reduce((sum, r) => sum + r.correctness[field], 0);
	console.log(
		`| ${deployment} | ${scenario} | ${scenario === 'S4' ? '-' : w} | ${runs.length} | ${['gapEvents', 'missingSeqs', 'dupes', 'outOfOrder', 'staleAfterSnapshot', 'reconnects', 'errors', 'notEnded', 'textMismatch', 'persistedNotDone'].map(total).join(' | ')} |`,
	);
}
