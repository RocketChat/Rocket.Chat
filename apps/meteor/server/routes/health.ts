import type { IncomingMessage, ServerResponse } from 'node:http';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { getHeapStatistics } from 'node:v8';

import { MongoInternals } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';

const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

export function pingMongo() {
	return mongo.db.command({ ping: 1 });
}

function setDefaultHeaders(res: ServerResponse) {
	// Set headers to prevent any caching of the health check response.
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('Content-Type', 'application/json');
}

/**
 * DEPRECATED Liveness Probe (`/health`)
 * Maintained for backward compatibility. Behaves like a simple liveness probe.
 * @deprecated Update infrastructure to use /livez and /readyz.
 */
WebApp.rawHandlers.use('/health', (_req: IncomingMessage, res: ServerResponse) => {
	setDefaultHeaders(res);

	res.writeHead(200);
	res.end(JSON.stringify({ status: 'ok' }));
});

/**
 * Readiness Probe Configuration
 * Defines tunable thresholds for readiness checks.
 */

const eventLoopHistogram = monitorEventLoopDelay();
eventLoopHistogram.enable();

const READINESS_THRESHOLDS = {
	EVENT_LOOP_LAG_MS: Number.parseFloat(process.env.EVENT_LOOP_LAG_MS ?? '') || 70,
	HEAP_USAGE_PERCENT: Number.parseFloat(process.env.HEAP_USAGE_PERCENT ?? '') || 0.85, // 85%
} as const;

/**
 * Checks event loop lag using the provided histogram. Can optionally reset the histogram after reading.
 * @param histogram - The event loop histogram to use.
 * @returns The status and p99 lag.
 */
function checkEventLoopLag(histogram: ReturnType<typeof monitorEventLoopDelay>) {
	const lagInNs = histogram.percentile(99);
	const lagInMs = lagInNs / 1_000_000;

	histogram.reset();

	const lagValue = Number.parseFloat(lagInMs.toFixed(2));

	if (lagInMs > READINESS_THRESHOLDS.EVENT_LOOP_LAG_MS) {
		return { status: 'degraded', lagMs: lagValue };
	}
	return { status: 'ok', lagMs: lagValue };
}

/**
 * Checks heap memory usage against a configured threshold.
 * @returns The status and memory usage percentage.
 */
function checkMemoryUsage() {
	const { heap_size_limit, used_heap_size } = getHeapStatistics();
	const usageRatio = used_heap_size / heap_size_limit;
	const usageValue = Number.parseFloat((usageRatio * 100).toFixed(2));

	if (usageRatio > READINESS_THRESHOLDS.HEAP_USAGE_PERCENT) {
		return { status: 'degraded', percentile: usageValue };
	}
	return { status: 'ok', percentile: usageValue };
}

async function checkMongo() {
	try {
		await pingMongo();
		return { status: 'ok' };
	} catch (err) {
		return { status: 'degraded', error: err instanceof Error ? err.message : String(err) };
	}
}

/**
 * Performs readiness health checks (memory, event loop, and MongoDB).
 * Used by the /readyz endpoint to determine if the application can process requests.
 */
async function performReadinessChecks() {
	const checks = {
		memory: checkMemoryUsage(),
		eventLoop: checkEventLoopLag(eventLoopHistogram),
		mongo: await checkMongo(),
	};

	const isHealthy = checks.memory.status === 'ok' && checks.eventLoop.status === 'ok' && checks.mongo.status === 'ok';
	const statusCode = isHealthy ? 200 : 503;

	const body = {
		status: isHealthy ? 'ok' : 'unavailable',
		checks,
	};

	return { statusCode, body, isHealthy };
}

/**
 * Liveness Probe (`/livez`)
 * Simple liveness check that only verifies the Node.js process can respond to requests.
 * If the process is truly deadlocked, it won't be able to respond and K8s will timeout and restart it.
 * Does NOT check memory, event loop, or external dependencies.
 */
WebApp.rawHandlers.use('/livez', (_req: IncomingMessage, res: ServerResponse) => {
	setDefaultHeaders(res);

	res.writeHead(200);
	res.end(JSON.stringify({ status: 'ok' }));
});

/**
 * Readiness Probe Endpoint (`/readyz`)
 * Checks if the application is capable of successfully processing user requests.
 * Includes checks for memory usage, event loop lag, and external dependencies like MongoDB.
 * A failure tells the orchestrator to stop sending traffic to this instance.
 */
WebApp.rawHandlers.use('/readyz', async (_req: IncomingMessage, res: ServerResponse) => {
	const { statusCode, body, isHealthy } = await performReadinessChecks();

	if (!isHealthy) {
		SystemLogger.warn({ msg: 'Readiness check failed', details: body });
	}

	setDefaultHeaders(res);

	res.writeHead(statusCode);
	res.end(JSON.stringify(body));
});
