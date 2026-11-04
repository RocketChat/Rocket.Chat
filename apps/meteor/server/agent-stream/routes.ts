import { monitorEventLoopDelay } from 'node:perf_hooks';

import { InstanceStatus } from '@rocket.chat/instance-status';
import { Rooms, Users } from '@rocket.chat/models';

import { brokerCounters, resetBrokerCounters } from './counters';
import { activeStreamCount, endStream, getSnapshot, killStream, producerCounters, resetProducerCounters, startStream } from './producer';
import type { EndReason } from './producer';
import { sinks } from './sinks';
import { httpApp } from '../lib/http/httpServer';

const BASE = '/_agent-stream';

const eventLoop = monitorEventLoopDelay();
eventLoop.enable();

let since = { wall: Date.now(), cpu: process.cpuUsage() };

const readMetrics = () => {
	const wallMs = Date.now() - since.wall;
	const cpu = process.cpuUsage(since.cpu);
	const cpuMs = (cpu.user + cpu.system) / 1000;
	return {
		instanceId: InstanceStatus.id(),
		pid: process.pid,
		port: process.env.PORT,
		wallMs,
		cpu: { userMs: cpu.user / 1000, systemMs: cpu.system / 1000, totalMs: cpuMs, pct: wallMs ? (cpuMs / wallMs) * 100 : 0 },
		eventLoop: {
			p50Ms: eventLoop.percentile(50) / 1e6,
			p99Ms: eventLoop.percentile(99) / 1e6,
			maxMs: eventLoop.max / 1e6,
		},
		memory: process.memoryUsage(),
		broker: { ...brokerCounters, eventsOut: { ...brokerCounters.eventsOut } },
		producer: { ...producerCounters, active: activeStreamCount() },
	};
};

const resetMetrics = () => {
	eventLoop.reset();
	resetBrokerCounters();
	resetProducerCounters();
	since = { wall: Date.now(), cpu: process.cpuUsage() };
};

// `gc=1` collects first, so memory readings compare across runs; it needs `--expose-gc`
httpApp.get(`${BASE}/metrics`, (c) => {
	if (c.req.query('gc') === '1') {
		globalThis.gc?.();
	}
	const metrics = readMetrics();
	if (c.req.query('reset') === '1') {
		resetMetrics();
	}
	return c.json(metrics);
});

httpApp.get(`${BASE}/status`, (c) => c.json({ active: activeStreamCount(), queued: producerCounters.queued }));

httpApp.get(`${BASE}/snapshot/:streamId`, (c) => {
	const snapshot = getSnapshot(c.req.param('streamId'));
	return snapshot ? c.json(snapshot) : c.json({ error: 'not-found' }, 404);
});

httpApp.post(`${BASE}/start`, async (c) => {
	const { rooms, userId, w = 0, tokens = 1000, tps = 40, sink = 'update-message' } = await c.req.json();
	const createSink = sinks[sink];
	const user = await Users.findOneById(userId);
	if (!createSink || !user || !Array.isArray(rooms)) {
		return c.json({ error: 'invalid-params' }, 400);
	}

	const started = await Promise.all(
		rooms.map(async (rid: string) => {
			const room = await Rooms.findOneById(rid);
			if (!room) {
				throw new Error(`room ${rid} not found`);
			}
			return startStream(room, user, createSink, { w, tokens, tokensPerSecond: tps });
		}),
	);
	return c.json({ streams: started });
});

httpApp.post(`${BASE}/stop`, async (c) => {
	const { streamId, reason = 'stopped' } = await c.req.json<{ streamId: string; reason?: EndReason }>();
	await endStream(streamId, reason);
	return c.json({ ok: true });
});

httpApp.post(`${BASE}/kill`, async (c) => {
	const { streamId } = await c.req.json<{ streamId: string }>();
	killStream(streamId);
	return c.json({ ok: true });
});
