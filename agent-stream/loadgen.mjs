#!/usr/bin/env node
// Runs one cell of the matrix (one scenario, deployment and W) and writes one JSON result.
// usage: node loadgen.mjs --scenario S1 --w 0 --deployment D1 --servers http://localhost:3000 --db agentstream_h0 \
//          --seed seed.json --out results/ [--run 1] [--adapter ddp-room-messages] [--sink update-message] [--label h0]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { Worker } from 'node:worker_threads';

import { MongoClient } from 'mongodb';

import { REPLY, SCENARIOS } from './scenarios.mjs';

const { values: args } = parseArgs({
	options: {
		'scenario': { type: 'string' },
		'w': { type: 'string', default: '0' },
		'deployment': { type: 'string', default: 'D1' },
		'servers': { type: 'string', default: 'http://localhost:3000' },
		'db': { type: 'string' },
		'mongo': { type: 'string', default: 'mongodb://localhost:27017/?directConnection=true' },
		'seed': { type: 'string' },
		'out': { type: 'string' },
		'run': { type: 'string', default: '1' },
		'adapter': { type: 'string', default: 'ddp-room-messages' },
		'sink': { type: 'string', default: 'update-message' },
		'label': { type: 'string', default: 'h0' },
		'workers': { type: 'string', default: '8' },
		'tokens': { type: 'string', default: String(REPLY.tokens) },
		'drain-timeout': { type: 'string', default: '300000' },
	},
});

const scenario = SCENARIOS[args.scenario];
if (!scenario || !args.db || !args.seed || !args.out) {
	throw new Error('--scenario, --db, --seed and --out are required');
}
const w = Number(args.w);
const tokens = Number(args.tokens);
const servers = args.servers.split(',');
const seed = JSON.parse(readFileSync(args.seed, 'utf8'));
const streams = scenario.streams(seed);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getJson = async (url, init) => {
	const res = await fetch(url, init);
	if (!res.ok) {
		throw new Error(`${url}: ${res.status} ${await res.text()}`);
	}
	return res.json();
};
const metricsOf = (query = '') => Promise.all(servers.map((server) => getJson(`${server}/_agent-stream/metrics${query}`)));
const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : null);

// With two instances, the first viewer goes to B, so S1 measures the path across instances. The producer runs on A.
const specs = streams
	.flatMap(({ rid, viewers }) => viewers.map((user) => ({ rid, userId: user.userId, token: user.token })))
	.map((spec, index) => ({
		...spec,
		index,
		baseUrl: servers[(index + 1) % servers.length],
	}));

const mongo = new MongoClient(args.mongo);
await mongo.connect();
const admin = mongo.db('admin');
const mongoCounters = async () => {
	const [{ totals }, { opcounters }] = await Promise.all([admin.command({ top: 1 }), admin.command({ serverStatus: 1 })]);
	const db = { queries: 0, getmore: 0, insert: 0, update: 0, remove: 0, commands: 0 };
	const byCollection = {};
	for (const [ns, entry] of Object.entries(totals)) {
		if (ns.startsWith(`${args.db}.`)) {
			for (const key of Object.keys(db)) {
				db[key] += entry[key]?.count ?? 0;
				byCollection[`${ns.slice(args.db.length + 1)}.${key}`] = entry[key]?.count ?? 0;
			}
		}
	}
	return { db, byCollection, server: { ...opcounters } };
};
const diff = (after, before) =>
	Object.fromEntries(Object.entries(after).map(([key, value]) => [key, Number(value) - Number(before[key] ?? 0)]));

// --- connect the viewers
const memoryBefore = scenario.idle ? await metricsOf('?gc=1') : undefined;
const workerCount = Math.min(Number(args.workers), specs.length);
const workers = Array.from({ length: workerCount }, (_, i) => {
	const worker = new Worker(new URL('./viewer-worker.mjs', import.meta.url), {
		workerData: { specs: specs.filter((spec) => spec.index % workerCount === i), adapter: args.adapter, connectConcurrency: 10 },
	});
	worker.setMaxListeners(0);
	return worker;
});
const ask = (worker, cmd, extra, replyType) =>
	new Promise((resolve) => {
		const onMessage = (msg) => {
			if (msg.type === replyType) {
				worker.off('message', onMessage);
				resolve(msg);
			}
		};
		replyType && worker.on('message', onMessage);
		worker.postMessage({ cmd, ...extra });
		replyType || resolve();
	});
const connectStarted = Date.now();
const ready = await Promise.all(workers.map((worker) => new Promise((resolve) => worker.once('message', resolve))));
const connectFailed = ready.reduce((sum, msg) => sum + msg.failed, 0);
const connectMs = Date.now() - connectStarted;
console.log(`${specs.length} viewers connected in ${connectMs} ms, ${connectFailed} failed`);

let memoryPerConnection;
if (scenario.idle) {
	await sleep(5000);
	const memoryAfter = await metricsOf('?gc=1');
	const sum = (list, key) => list.reduce((total, m) => total + m.memory[key], 0);
	memoryPerConnection = {
		rssBytes: (sum(memoryAfter, 'rss') - sum(memoryBefore, 'rss')) / specs.length,
		heapUsedBytes: (sum(memoryAfter, 'heapUsed') - sum(memoryBefore, 'heapUsed')) / specs.length,
	};
}

// --- the idle rate with the viewers connected, so the cost of the replies can be told apart from the background
const IDLE_PROBE_MS = 5000;
await metricsOf('?reset=1');
const mongoIdleBefore = await mongoCounters();
await sleep(IDLE_PROBE_MS);
const mongoIdleAfter = await mongoCounters();
// reading with reset=1 also starts the measured window
const idleMetrics = await metricsOf('?reset=1');

// --- the measured window
// busy and total CPU ms of the whole machine, to flag runs that shared the machine with other work
const machineTimes = () =>
	os
		.cpus()
		.reduce(
			(acc, { times }) => ({
				busy: acc.busy + times.user + times.nice + times.sys + times.irq,
				total: acc.total + times.user + times.nice + times.sys + times.irq + times.idle,
			}),
			{ busy: 0, total: 0 },
		);
const machineBefore = machineTimes();
const mongoBefore = await mongoCounters();
const cpuBefore = process.cpuUsage();
const t0 = Date.now();
await Promise.all(workers.map((worker) => ask(worker, 'go')));

let started = [];
let reconnectTimer;
let timedOut = false;
if (scenario.idle) {
	await sleep(scenario.idleMs);
} else {
	({ streams: started } = await getJson(`${servers[0]}/_agent-stream/start`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			rooms: streams.map(({ rid }) => rid),
			userId: seed.bot.userId,
			w,
			tokens,
			tps: REPLY.tokensPerSecond,
			sink: args.sink,
		}),
	}));

	if (scenario.reconnect) {
		const { everyMs, fraction } = scenario.reconnect;
		reconnectTimer = setInterval(() => {
			const picked = specs.filter(() => Math.random() < fraction).map((spec) => spec.index);
			workers.forEach((worker, i) => ask(worker, 'reconnect', { indexes: picked.filter((index) => index % workerCount === i) }));
		}, everyMs);
	}

	const deadline = t0 + (tokens / REPLY.tokensPerSecond) * 1000 + Number(args['drain-timeout']);
	let serverIdleSince;
	for (;;) {
		await sleep(500);
		const [progress, status] = await Promise.all([
			Promise.all(workers.map((worker) => ask(worker, 'progress', {}, 'progress'))),
			getJson(`${servers[0]}/_agent-stream/status`),
		]);
		const ended = progress.reduce((sum, msg) => sum + msg.ended, 0);
		const serverIdle = status.active === 0 && status.queued === 0;
		serverIdleSince = serverIdle ? (serverIdleSince ?? Date.now()) : undefined;
		// viewers get 10 s after the server is done, for what is still in flight
		if ((ended === specs.length && serverIdle) || (serverIdleSince && Date.now() - serverIdleSince > 10_000)) {
			break;
		}
		if (Date.now() > deadline) {
			timedOut = true;
			break;
		}
	}
	clearInterval(reconnectTimer);
}
const t1 = Date.now();
const serverMetrics = await metricsOf();
const mongoAfter = await mongoCounters();
const cpu = process.cpuUsage(cpuBefore);
const machineAfter = machineTimes();

// --- collect
const results = await Promise.all(workers.map((worker) => ask(worker, 'finish', {}, 'result')));
await Promise.all(workers.map((worker) => worker.terminate()));
const viewers = results.flatMap((r) => r.viewers);
const latencies = Float64Array.from(results.flatMap((r) => Array.from(r.latencies))).sort();

const persisted = {};
for (const { streamId, rid, mid } of started) {
	const viewer = specs.find((spec) => spec.rid === rid);
	const { message } = await getJson(`${servers[0]}/api/v1/chat.getMessage?msgId=${mid}`, {
		headers: { 'X-User-Id': viewer.userId, 'X-Auth-Token': viewer.token },
	});
	persisted[streamId] = {
		text: message.msg,
		state: message.streaming?.state,
		seq: message.streaming?.seq,
		bytes: JSON.stringify(message).length,
	};
}
await mongo.close();

const sum = (list, fn) => list.reduce((total, item, i) => total + fn(item, i), 0);
const replies = started.length;
const delivered = sum(viewers, (v) => v.delivered);
const cpuMs = sum(serverMetrics, (m) => m.cpu.totalMs);
const bytes = viewers.map((v) => v.bytesIn).sort((a, b) => a - b);
const mongoDb = diff(mongoAfter.db, mongoBefore.db);
const brokerOut = (m) => ({
	events: sum(Object.values(m.broker.eventsOut), (n) => n),
	packets: m.broker.packetsOut,
	bytes: m.broker.bytesOut,
});
const producer = serverMetrics[0].producer;
const idleCpuMsPerSec = idleMetrics.map((m) => (m.cpu.totalMs / m.wallMs) * 1000);
const netCpuMs = sum(serverMetrics, (m, i) => m.cpu.totalMs - (idleCpuMsPerSec[i] * m.wallMs) / 1000);
const idleDb = diff(mongoIdleAfter.db, mongoIdleBefore.db);
const netDb = Object.fromEntries(Object.entries(mongoDb).map(([key, value]) => [key, value - (idleDb[key] * (t1 - t0)) / IDLE_PROBE_MS]));
const textMismatch = viewers.filter((v) => v.streamId && persisted[v.streamId] && v.text !== persisted[v.streamId].text).length;

const result = {
	label: args.label,
	adapter: args.adapter,
	sink: args.sink,
	deployment: args.deployment,
	scenario: args.scenario,
	w,
	run: Number(args.run),
	tokens,
	at: new Date(t0).toISOString(),
	machine: {
		cpu: os.cpus()[0].model,
		cores: os.cpus().length,
		ramGB: Math.round(os.totalmem() / 2 ** 30),
		node: process.version,
		mode: 'production bundle',
	},
	viewers: specs.length,
	replies,
	connect: { ms: connectMs, failed: connectFailed },
	windowMs: t1 - t0,
	timedOut,
	producer,
	expectedDeltasPerViewer: replies ? producer.deltas / replies + 1 : 0,
	delivered,
	server: {
		cpuMs,
		cpuMsPerDeliveredDelta: delivered ? cpuMs / delivered : null,
		cpuMsPerReply: replies ? cpuMs / replies : null,
		idleCpuMsPerSec,
		netCpuMs,
		netCpuMsPerDeliveredDelta: delivered ? netCpuMs / delivered : null,
		netCpuMsPerReply: replies ? netCpuMs / replies : null,
		cpuPct: serverMetrics.map((m) => m.cpu.pct),
		eventLoopP99Ms: serverMetrics.map((m) => m.eventLoop.p99Ms),
		rssBytes: serverMetrics.map((m) => m.memory.rss),
		heapUsedBytes: serverMetrics.map((m) => m.memory.heapUsed),
		memoryPerConnection,
	},
	mongo: {
		db: mongoDb,
		server: diff(mongoAfter.server, mongoBefore.server),
		byCollection: Object.fromEntries(Object.entries(diff(mongoAfter.byCollection, mongoBefore.byCollection)).filter(([, n]) => n > 0)),
		readsPerReply: replies ? (mongoDb.queries + mongoDb.getmore) / replies : null,
		writesPerReply: replies ? (mongoDb.insert + mongoDb.update + mongoDb.remove) / replies : null,
		commandsPerReply: replies ? mongoDb.commands / replies : null,
		idlePerSec: Object.fromEntries(Object.entries(idleDb).map(([key, value]) => [key, (value / IDLE_PROBE_MS) * 1000])),
		netReadsPerReply: replies ? (netDb.queries + netDb.getmore) / replies : null,
		netWritesPerReply: replies ? (netDb.insert + netDb.update + netDb.remove) / replies : null,
	},
	broker: {
		perInstance: serverMetrics.map((m) => ({
			...brokerOut(m),
			eventsOut: m.broker.eventsOut,
			packetsIn: m.broker.packetsIn,
			bytesIn: m.broker.bytesIn,
		})),
		eventsPerReply: replies ? sum(serverMetrics, (m) => brokerOut(m).events) / replies : null,
		bytesPerReply: replies ? sum(serverMetrics, (m) => brokerOut(m).bytes) / replies : null,
	},
	bytesPerViewerPerReply: { mean: sum(bytes, (b) => b) / bytes.length, p50: percentile(bytes, 50), max: bytes[bytes.length - 1] },
	latencyMs: {
		count: latencies.length,
		p50: percentile(latencies, 50),
		p95: percentile(latencies, 95),
		p99: percentile(latencies, 99),
		max: latencies[latencies.length - 1] ?? null,
	},
	correctness: {
		gapEvents: sum(viewers, (v) => v.gapEvents),
		missingSeqs: sum(viewers, (v) => v.missingSeqs),
		dupes: sum(viewers, (v) => v.dupes),
		outOfOrder: sum(viewers, (v) => v.outOfOrder),
		staleAfterSnapshot: sum(viewers, (v) => v.stale),
		reconnects: sum(viewers, (v) => v.reconnects),
		errors: sum(viewers, (v) => v.errors),
		notEnded: replies ? viewers.filter((v) => !v.ended).length : 0,
		textMismatch,
		persistedNotDone: Object.values(persisted).filter((p) => p.state !== 'done').length,
	},
	persistedMessageBytes: Object.values(persisted)[0]?.bytes ?? null,
	loadgen: { cpuPct: ((cpu.user + cpu.system) / 1000 / (t1 - t0)) * 100 },
	// cores busy with anything but the instances and the load generator; Mongo in Docker counts here
	otherBusyCores:
		((machineAfter.busy - machineBefore.busy) / (machineAfter.total - machineBefore.total)) * os.cpus().length -
		(cpuMs + (cpu.user + cpu.system) / 1000) / (t1 - t0),
};

mkdirSync(args.out, { recursive: true });
const file = join(args.out, `${args.label}-${args.deployment}-${args.scenario}-w${w}-r${args.run}.json`);
writeFileSync(file, JSON.stringify(result, null, 2));
console.log(
	`${file}: window ${result.windowMs} ms${timedOut ? ' (TIMED OUT)' : ''}, cpu/delta ${result.server.cpuMsPerDeliveredDelta?.toFixed(3)} ms (net ${result.server.netCpuMsPerDeliveredDelta?.toFixed(3)}), ` +
		`p50/p99 ${result.latencyMs.p50}/${result.latencyMs.p99} ms, delivered ${delivered}, ${JSON.stringify(result.correctness)}`,
);
process.exit(0);
