/**
 * Benchmark: three JSON-RPC pipelines on the host <-> subprocess bridge.
 *
 * Run it with:
 *
 *     yarn workspace @rocket.chat/apps bench:jsonrpc
 *
 * The corpus in `fixtures.ts` is the traffic the bridge really carries. Every
 * fixture is replayed through every pipeline (`contenders.ts`) and reported on
 * four axes:
 *
 *   1. correctness - every pipeline must return the same message before anything is timed
 *   2. wire size   - bytes msgpack puts on the pipe
 *   3. speed       - ns/op for build, encode, receive, and the three combined
 *   4. memory      - heap retained per received message, plus the GC pressure of a run
 *
 * The contenders are ordered oldest to newest, and the report compares the last
 * one against each of the others. With the default three that answers two
 * questions in one run: what the in-house types bought over `jsonrpc-lite`, and
 * what the codec's JSON-RPC extension buys over putting the same types on the
 * wire as a plain map.
 *
 * Environment overrides: BENCH_SAMPLES, BENCH_TARGET_MS, BENCH_FILTER,
 * BENCH_CONTENDERS (comma-separated substrings of the contender names, e.g.
 * `BENCH_CONTENDERS=no ext,in-house` to skip the library).
 */
import * as assert from 'node:assert';
import { PerformanceObserver } from 'node:perf_hooks';

import { version as msgpackVersion } from '@msgpack/msgpack/package.json';
import { version as jsonRpcLiteVersion } from 'jsonrpc-lite/package.json';

import { createInHouseContender, createLegacyContender, createNoExtensionContender, type Contender } from './contenders';
import { loadFixtures, type Fixture } from './fixtures';

const SAMPLES = Number(process.env.BENCH_SAMPLES ?? 7);
const TARGET_MS = Number(process.env.BENCH_TARGET_MS ?? 50);
const FILTER = process.env.BENCH_FILTER;
const CONTENDERS = process.env.BENCH_CONTENDERS;
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
		// Normalized so the contenders stay comparable even when calibration
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

/** How much better `candidate` is than `reference`, as a signed percentage of `reference`. */
function formatDelta(reference: number, candidate: number): string {
	if (reference === 0) return '-';

	const change = ((candidate - reference) / reference) * 100;
	const sign = change > 0 ? '+' : '';

	return `${sign}${change.toFixed(1)}%`;
}

function formatSpeedup(reference: number, candidate: number): string {
	return `${(reference / candidate).toFixed(2)}x`;
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

/**
 * Every table has one value column per contender, then one comparison column per
 * other contender: the last contender - the pipeline being judged - measured
 * against each of the ones before it.
 */
function headersFor(contenders: Contender[]): string[] {
	return ['fixture', ...contenders.map((contender) => contender.name), ...contenders.slice(0, -1).map(({ name }) => `vs ${name}`)];
}

function comparisonCells(values: number[], format: (reference: number, candidate: number) => string): string[] {
	const candidate = values[values.length - 1];

	return values.slice(0, -1).map((reference) => format(reference, candidate));
}

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

function verify(fixtures: Fixture[], contenders: Contender[]): void {
	const [reference, ...rest] = contenders;

	for (const fixture of fixtures) {
		const expected = reference.normalize(reference.receive(reference.encode(reference.build(fixture))));

		for (const contender of rest) {
			const actual = contender.normalize(contender.receive(contender.encode(contender.build(fixture))));

			try {
				assert.deepStrictEqual(actual, expected);
			} catch (error) {
				console.error(`\n  FAIL  "${fixture.name}" comes out of "${contender.name}" different from "${reference.name}".`);
				throw error;
			}
		}
	}

	console.log(`  OK  ${fixtures.length} fixtures round-trip identically through all ${contenders.length} pipelines.\n`);
}

function selectContenders(): Contender[] {
	const all = [createLegacyContender(), createNoExtensionContender(), createInHouseContender()];

	if (!CONTENDERS) {
		return all;
	}

	const wanted = CONTENDERS.split(',').map((name) => name.trim().toLowerCase());
	const selected = all.filter((contender) => wanted.some((name) => contender.name.toLowerCase().includes(name)));

	if (selected.length < 2) {
		throw new Error(`BENCH_CONTENDERS="${CONTENDERS}" matched ${selected.length} of ${all.length} contenders; at least 2 are needed`);
	}

	return selected;
}

async function main(): Promise<void> {
	const all = await loadFixtures();
	const fixtures = FILTER ? all.filter((fixture) => fixture.name.includes(FILTER)) : all;

	if (!fixtures.length) {
		throw new Error(`BENCH_FILTER="${FILTER}" matched none of the ${all.length} fixtures`);
	}

	const contenders = selectContenders();
	const subject = contenders[contenders.length - 1];
	const headers = headersFor(contenders);

	console.log('JSON-RPC bridge benchmark\n');
	console.log(`  ${contenders.map((contender) => contender.name).join('  vs  ')}`);
	console.log(`  node ${process.version}  |  jsonrpc-lite ${jsonRpcLiteVersion}  |  @msgpack/msgpack ${msgpackVersion}`);
	console.log(`  ${fixtures.length} fixtures  |  ${SAMPLES} samples of ~${TARGET_MS} ms each`);
	console.log(`  the "vs" columns read "${subject.name}" against that column\n`);

	if (!gc) {
		console.log('  NOTE  run with --expose-gc for the memory section (the bench:jsonrpc script does).\n');
	}

	verify(fixtures, contenders);

	// -------------------------------------------------------------------- wire size

	console.log('WIRE SIZE  bytes msgpack writes to the pipe\n');

	const sizeRows: string[][] = [];
	const totalBytes = contenders.map(() => 0);

	for (const fixture of fixtures) {
		const bytes = contenders.map((contender) => contender.encode(contender.build(fixture)).byteLength);

		bytes.forEach((value, index) => {
			totalBytes[index] += value;
		});

		sizeRows.push([fixture.name, ...bytes.map(formatBytes), ...comparisonCells(bytes, formatDelta)]);
	}

	sizeRows.push(['TOTAL', ...totalBytes.map(formatBytes), ...comparisonCells(totalBytes, formatDelta)]);

	printTable(headers, sizeRows);

	// -------------------------------------------------------------------- speed

	const results = new Map<string, Map<Step, Measurement[]>>();

	// Every step is measured before anything is printed, which is a long silent
	// gap. The progress line goes to stderr so a redirected report stays clean.
	for (const [index, fixture] of fixtures.entries()) {
		const perStep = new Map<Step, Measurement[]>();

		for (const step of STEPS) {
			const measurements: Measurement[] = [];

			for (const contender of contenders) {
				process.stderr.write(
					`\r  measuring ${index + 1}/${fixtures.length} ${step} - ${fixture.name} - ${contender.name}${' '.repeat(20)}`,
				);

				measurements.push(await measure(stepFor(contender, fixture, step)));
			}

			perStep.set(step, measurements);
		}

		results.set(fixture.name, perStep);
	}

	process.stderr.write(`\r${' '.repeat(110)}\r`);

	for (const step of STEPS) {
		console.log(`\nSPEED / ${step}  ns per message, median of ${SAMPLES} samples - lower is better\n`);

		const rows: string[][] = [];
		const totalNs = contenders.map(() => 0);

		for (const fixture of fixtures) {
			const measurements = results.get(fixture.name).get(step);
			const nsPerOp = measurements.map((measurement) => measurement.nsPerOp);

			nsPerOp.forEach((value, index) => {
				totalNs[index] += value;
			});

			rows.push([fixture.name, ...nsPerOp.map((value) => formatNumber(value)), ...comparisonCells(nsPerOp, formatSpeedup)]);
		}

		rows.push([
			`TOTAL (one of each of the ${fixtures.length})`,
			...totalNs.map((value) => formatNumber(value)),
			...comparisonCells(totalNs, formatSpeedup),
		]);

		printTable(headers, rows);
	}

	// -------------------------------------------------------------------- memory

	console.log('\nGC PRESSURE / round-trip  collections and pause time per 1M messages - lower is better\n');

	const gcRows: string[][] = [];

	for (const fixture of fixtures) {
		const measurements = results.get(fixture.name).get('round-trip');
		const pauses = measurements.map((measurement) => measurement.gcPauseMs);

		gcRows.push([
			fixture.name,
			...measurements.map(({ gcCount, gcPauseMs }) => `${formatNumber(gcCount)} / ${formatNumber(gcPauseMs)} ms`),
			...comparisonCells(pauses, formatDelta),
		]);
	}

	printTable(headers, gcRows);

	if (gc) {
		console.log('\nRETAINED HEAP  heap + external bytes still held by one received message - lower is better\n');

		const heapRows: string[][] = [];
		const totalHeap = contenders.map(() => 0);

		for (const fixture of fixtures) {
			const encoded = contenders.map((contender) => contender.encode(contender.build(fixture)));
			const count = retainedCount(encoded[encoded.length - 1].byteLength);
			const heap = contenders.map((contender, index) => retainedBytes(() => contender.receive(encoded[index]), count));

			heap.forEach((value, index) => {
				totalHeap[index] += value;
			});

			heapRows.push([fixture.name, ...heap.map(formatBytes), ...comparisonCells(heap, formatDelta)]);
		}

		heapRows.push(['TOTAL', ...totalHeap.map(formatBytes), ...comparisonCells(totalHeap, formatDelta)]);

		printTable(headers, heapRows);
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
