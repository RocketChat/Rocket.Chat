/**
 * Benchmark: `jsonrpc-lite` vs the in-house JSON-RPC types on the host <-> subprocess bridge.
 *
 * Run it with:
 *
 *     yarn workspace @rocket.chat/apps bench:jsonrpc
 *
 * The corpus in `fixtures.ts` is the traffic the bridge really carries. Every
 * fixture is replayed through both pipelines (`contenders.ts`) and reported on
 * four axes:
 *
 *   1. correctness - both pipelines must return the same message before anything is timed
 *   2. wire size   - bytes msgpack puts on the pipe
 *   3. speed       - ns/op for build, encode, receive, and the three combined
 *   4. memory      - heap retained per received message, plus the GC pressure of a run
 *
 * Environment overrides: BENCH_SAMPLES, BENCH_TARGET_MS, BENCH_FILTER.
 */
import * as assert from 'node:assert';
import { PerformanceObserver } from 'node:perf_hooks';

import { version as msgpackVersion } from '@msgpack/msgpack/package.json';
import { version as jsonRpcLiteVersion } from 'jsonrpc-lite/package.json';

import { createInHouseContender, createLegacyContender, type Contender } from './contenders';
import { loadFixtures, type Fixture } from './fixtures';

const SAMPLES = Number(process.env.BENCH_SAMPLES ?? 7);
const TARGET_MS = Number(process.env.BENCH_TARGET_MS ?? 50);
const FILTER = process.env.BENCH_FILTER;
/** Batch size for the retained-heap probe: big enough to beat noise, small enough to fit. */
const retainedCount = (wireSize: number) => Math.max(100, Math.min(4000, Math.round(4e6 / wireSize)));

type Step = 'build' | 'encode' | 'receive' | 'round-trip';

const STEPS: Step[] = ['build', 'encode', 'receive', 'round-trip'];

/**
 * Every timed loop parks its result here. Assigning to a module-scoped binding
 * makes the value escape, which stops V8 from scalar-replacing the object we
 * just asked the contender to allocate - without it, `build` measures nothing.
 */
let blackhole: unknown;

// ---------------------------------------------------------------------------- timing

function timeLoop(fn: () => void, iterations: number): number {
	const start = process.hrtime.bigint();

	for (let i = 0; i < iterations; i++) {
		fn();
	}

	return Number(process.hrtime.bigint() - start);
}

/** Picks an iteration count that makes one sample take about TARGET_MS. */
function calibrate(fn: () => void): number {
	const targetNs = TARGET_MS * 1e6;

	for (let iterations = 1; iterations <= 1e7; iterations *= 4) {
		const elapsed = timeLoop(fn, iterations);

		if (elapsed >= targetNs) {
			return Math.max(10, Math.round((iterations * targetNs) / elapsed));
		}
	}

	return 1e7;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = sorted.length >> 1;

	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

type Measurement = { nsPerOp: number; opsPerSecond: number; iterations: number; gcCount: number; gcPauseMs: number };

/** Lets the event loop turn, which is when Node hands buffered GC entries to observers. */
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

async function measure(fn: () => void): Promise<Measurement> {
	// Warm up so the timed samples see optimized code, not the interpreter.
	timeLoop(fn, 50);

	const iterations = calibrate(fn);

	let gcCount = 0;
	let gcPauseMs = 0;

	// Three traps here: GC entries only arrive through the singular `type` form,
	// not `entryTypes`; the callback fires on a later tick, which a synchronous
	// timing loop never reaches, so we drain the buffer ourselves with
	// `takeRecords()`; and the buffer only fills on an event loop turn, hence the
	// `await tick()` below.
	const observer = new PerformanceObserver(() => undefined);

	observer.observe({ type: 'gc' });

	const samples: number[] = [];

	for (let sample = 0; sample < SAMPLES; sample++) {
		samples.push(timeLoop(fn, iterations) / iterations);
	}

	await tick();

	for (const entry of observer.takeRecords()) {
		gcCount += 1;
		gcPauseMs += entry.duration;
	}

	observer.disconnect();

	const nsPerOp = median(samples);
	const totalOps = iterations * SAMPLES;

	return {
		nsPerOp,
		opsPerSecond: 1e9 / nsPerOp,
		iterations,
		// Normalized so the two contenders stay comparable even when calibration
		// gave them different iteration counts.
		gcCount: (gcCount / totalOps) * 1e6,
		gcPauseMs: (gcPauseMs / totalOps) * 1e6,
	};
}

// ---------------------------------------------------------------------------- memory

const { gc } = globalThis as { gc?: () => void };

function collect(): void {
	gc?.();
	gc?.();
}

/**
 * `heapUsed` alone misses the payload: a decoded `Buffer` lives in external
 * memory, so an upload message would look 100x smaller than it is.
 */
function footprint(): number {
	const { heapUsed, external } = process.memoryUsage();

	return heapUsed + external;
}

/**
 * Memory held by one received message: allocate a batch, keep every result
 * alive, and read the growth that survives a full collection.
 */
function retainedBytes(make: () => unknown, count: number): number {
	collect();

	const keep: unknown[] = new Array(count);
	const before = footprint();

	for (let i = 0; i < count; i++) {
		keep[i] = make();
	}

	collect();

	const after = footprint();

	// Touch the array after the measurement so nothing above is collected early.
	blackhole = keep;

	// Discount the backing array itself (one pointer slot per entry).
	return (after - before) / count - 8;
}

// ---------------------------------------------------------------------------- reporting

function formatNumber(value: number, digits = 0): string {
	return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatBytes(bytes: number): string {
	if (Math.abs(bytes) >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
	if (Math.abs(bytes) >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;

	return `${formatNumber(bytes)} B`;
}

/** How much better `inHouse` is than `legacy`, as a signed percentage of `legacy`. */
function formatDelta(legacy: number, inHouse: number): string {
	if (legacy === 0) return '-';

	const change = ((inHouse - legacy) / legacy) * 100;
	const sign = change > 0 ? '+' : '';

	return `${sign}${change.toFixed(1)}%`;
}

function formatSpeedup(legacy: number, inHouse: number): string {
	return `${(legacy / inHouse).toFixed(2)}x`;
}

function printTable(headers: string[], rows: string[][]): void {
	const widths = headers.map((header, column) => Math.max(header.length, ...rows.map((row) => row[column].length)));
	const pad = (cell: string, column: number) => (column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column]));

	console.log(headers.map(pad).join('  '));
	console.log(widths.map((width) => '-'.repeat(width)).join('  '));

	for (const row of rows) {
		console.log(row.map(pad).join('  '));
	}
}

// ---------------------------------------------------------------------------- runner

/** Builds the closure for one step so the timed loop contains nothing but the work. */
function stepFor(contender: Contender, fixture: Fixture, step: Step): () => void {
	const message = contender.build(fixture);
	const bytes = contender.encode(message);

	switch (step) {
		case 'build':
			return () => {
				blackhole = contender.build(fixture);
			};
		case 'encode':
			return () => {
				blackhole = contender.encode(message);
			};
		case 'receive':
			return () => {
				blackhole = contender.receive(bytes);
			};
		case 'round-trip':
			return () => {
				blackhole = contender.receive(contender.encode(contender.build(fixture)));
			};
	}
}

function verify(fixtures: Fixture[], legacy: Contender, inHouse: Contender): void {
	for (const fixture of fixtures) {
		const fromLegacy = legacy.normalize(legacy.receive(legacy.encode(legacy.build(fixture))));
		const fromInHouse = inHouse.normalize(inHouse.receive(inHouse.encode(inHouse.build(fixture))));

		try {
			assert.deepStrictEqual(fromInHouse, fromLegacy);
		} catch (error) {
			console.error(`\n  FAIL  "${fixture.name}" does not survive both pipelines identically.`);
			throw error;
		}
	}

	console.log(`  OK  ${fixtures.length} fixtures round-trip identically through both pipelines.\n`);
}

async function main(): Promise<void> {
	const all = await loadFixtures();
	const fixtures = FILTER ? all.filter((fixture) => fixture.name.includes(FILTER)) : all;

	if (!fixtures.length) {
		throw new Error(`BENCH_FILTER="${FILTER}" matched none of the ${all.length} fixtures`);
	}

	const legacy = createLegacyContender();
	const inHouse = createInHouseContender();

	console.log('JSON-RPC bridge benchmark: jsonrpc-lite vs the in-house types\n');
	console.log(`  node ${process.version}  |  jsonrpc-lite ${jsonRpcLiteVersion}  |  @msgpack/msgpack ${msgpackVersion}`);
	console.log(`  ${fixtures.length} fixtures  |  ${SAMPLES} samples of ~${TARGET_MS} ms each\n`);

	if (!gc) {
		console.log('  NOTE  run with --expose-gc for the memory section (the bench:jsonrpc script does).\n');
	}

	verify(fixtures, legacy, inHouse);

	// -------------------------------------------------------------------- wire size

	console.log('WIRE SIZE  bytes msgpack writes to the pipe\n');

	const sizeRows: string[][] = [];
	let legacyTotalBytes = 0;
	let inHouseTotalBytes = 0;

	for (const fixture of fixtures) {
		const legacyBytes = legacy.encode(legacy.build(fixture)).byteLength;
		const inHouseBytes = inHouse.encode(inHouse.build(fixture)).byteLength;

		legacyTotalBytes += legacyBytes;
		inHouseTotalBytes += inHouseBytes;

		sizeRows.push([fixture.name, formatBytes(legacyBytes), formatBytes(inHouseBytes), formatDelta(legacyBytes, inHouseBytes)]);
	}

	sizeRows.push(['TOTAL', formatBytes(legacyTotalBytes), formatBytes(inHouseTotalBytes), formatDelta(legacyTotalBytes, inHouseTotalBytes)]);

	printTable(['fixture', 'jsonrpc-lite', 'in-house', 'delta'], sizeRows);

	// -------------------------------------------------------------------- speed

	const results = new Map<string, Map<Step, { legacy: Measurement; inHouse: Measurement }>>();

	// Every step is measured before anything is printed, which is a long silent
	// gap. The progress line goes to stderr so a redirected report stays clean.
	for (const [index, fixture] of fixtures.entries()) {
		const perStep = new Map<Step, { legacy: Measurement; inHouse: Measurement }>();

		for (const step of STEPS) {
			process.stderr.write(`\r  measuring ${index + 1}/${fixtures.length} ${step} - ${fixture.name}${' '.repeat(20)}`);

			perStep.set(step, {
				legacy: await measure(stepFor(legacy, fixture, step)),
				inHouse: await measure(stepFor(inHouse, fixture, step)),
			});
		}

		results.set(fixture.name, perStep);
	}

	process.stderr.write(`\r${' '.repeat(100)}\r`);

	for (const step of STEPS) {
		console.log(`\nSPEED / ${step}  ns per message, median of ${SAMPLES} samples - lower is better\n`);

		const rows: string[][] = [];
		let legacyTotalNs = 0;
		let inHouseTotalNs = 0;

		for (const fixture of fixtures) {
			const { legacy: legacyResult, inHouse: inHouseResult } = results.get(fixture.name).get(step);

			legacyTotalNs += legacyResult.nsPerOp;
			inHouseTotalNs += inHouseResult.nsPerOp;

			rows.push([
				fixture.name,
				formatNumber(legacyResult.nsPerOp),
				formatNumber(inHouseResult.nsPerOp),
				formatSpeedup(legacyResult.nsPerOp, inHouseResult.nsPerOp),
			]);
		}

		rows.push([
			`TOTAL (one of each of the ${fixtures.length})`,
			formatNumber(legacyTotalNs),
			formatNumber(inHouseTotalNs),
			formatSpeedup(legacyTotalNs, inHouseTotalNs),
		]);

		printTable(['fixture', 'jsonrpc-lite', 'in-house', 'speedup'], rows);
	}

	// -------------------------------------------------------------------- memory

	console.log('\nGC PRESSURE / round-trip  collections and pause time per 1M messages - lower is better\n');

	const gcRows: string[][] = [];

	for (const fixture of fixtures) {
		const { legacy: legacyResult, inHouse: inHouseResult } = results.get(fixture.name).get('round-trip');

		gcRows.push([
			fixture.name,
			`${formatNumber(legacyResult.gcCount)} / ${formatNumber(legacyResult.gcPauseMs)} ms`,
			`${formatNumber(inHouseResult.gcCount)} / ${formatNumber(inHouseResult.gcPauseMs)} ms`,
			formatDelta(legacyResult.gcPauseMs, inHouseResult.gcPauseMs),
		]);
	}

	printTable(['fixture', 'jsonrpc-lite', 'in-house', 'pause delta'], gcRows);

	if (gc) {
		console.log('\nRETAINED HEAP  heap + external bytes still held by one received message - lower is better\n');

		const heapRows: string[][] = [];
		let legacyTotalHeap = 0;
		let inHouseTotalHeap = 0;

		for (const fixture of fixtures) {
			const legacyBytes = legacy.encode(legacy.build(fixture));
			const inHouseBytes = inHouse.encode(inHouse.build(fixture));

			const count = retainedCount(inHouseBytes.byteLength);
			const legacyHeap = retainedBytes(() => legacy.receive(legacyBytes), count);
			const inHouseHeap = retainedBytes(() => inHouse.receive(inHouseBytes), count);

			legacyTotalHeap += legacyHeap;
			inHouseTotalHeap += inHouseHeap;

			heapRows.push([fixture.name, formatBytes(legacyHeap), formatBytes(inHouseHeap), formatDelta(legacyHeap, inHouseHeap)]);
		}

		heapRows.push(['TOTAL', formatBytes(legacyTotalHeap), formatBytes(inHouseTotalHeap), formatDelta(legacyTotalHeap, inHouseTotalHeap)]);

		printTable(['fixture', 'jsonrpc-lite', 'in-house', 'delta'], heapRows);
	}

	const { rss, heapUsed } = process.memoryUsage();

	console.log(`\nprocess: rss ${formatBytes(rss)}, heapUsed ${formatBytes(heapUsed)}`);

	// Read the blackhole once at the end so every loop above had to keep its result.
	if (blackhole === Symbol.for('never')) console.log('unreachable');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
