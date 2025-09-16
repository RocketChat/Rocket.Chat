import type { IncomingMessage, ServerResponse } from 'http';
import { monitorEventLoopDelay } from 'perf_hooks';

import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';

/**
 * A shared handler for liveness probes to reduce code duplication.
 * Sets common headers and sends a standard 200 OK response.
 * @param res The HTTP response object.
 */
const sendLivenessResponse = (res: ServerResponse) => {
	// Set headers to prevent any caching of the health check response.
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('Content-Type', 'application/json');

	res.writeHead(200);
	res.end(JSON.stringify({ status: 'ok' }));
};

/**
 * Liveness Probe (`/livez`)
 * Responds with 200 OK if the process is running.
 * Used by orchestrators (Kubernetes) to decide whether to restart the container.
 */
WebApp.rawConnectHandlers.use('/livez', (_req: IncomingMessage, res: ServerResponse) => {
	sendLivenessResponse(res);
});

/**
 * DEPRECATED Liveness Probe (`/health`)
 * Maintained for backward compatibility. Behaves like the /livez probe.
 * @deprecated Update infrastructure to use /livez and /readyz.
 */
WebApp.rawConnectHandlers.use('/health', (_req: IncomingMessage, res: ServerResponse) => {
	SystemLogger.info('Deprecated /health endpoint was called. Please update to /livez or /readyz.');
	sendLivenessResponse(res);
});

/**
 * Readiness Probe Configuration
 * Defines tunable thresholds for readiness checks.
 */

// Initialize and enable the event loop delay histogram for accurate monitoring.
const eventLoopHistogram = monitorEventLoopDelay();
eventLoopHistogram.enable();

// Configurable thresholds for readiness checks.
const READINESS_THRESHOLDS = {
	EVENT_LOOP_LAG_MS: Number(process.env.EVENT_LOOP_LAG_MS) || 70,
	HEAP_USAGE_PERCENT: Number(process.env.HEAP_USAGE_PERCENT) || 0.85, // 85%
};

/**
 * Checks event loop lag, a key indicator of Node.js saturation.
 * @returns The status and p99 lag.
 */
function checkEventLoopLag() {
	// Get the 99th percentile value from the histogram (in nanoseconds).
	const lagInNs = eventLoopHistogram.percentile(99);
	const lagInMs = lagInNs / 1_000_000; // Convert to milliseconds

	// Reset the histogram to measure the next interval cleanly.
	eventLoopHistogram.reset();

	if (lagInMs > READINESS_THRESHOLDS.EVENT_LOOP_LAG_MS) {
		return { status: 'degraded', lag: `${lagInMs.toFixed(2)}ms (p99)` };
	}
	return { status: 'ok', lag: `${lagInMs.toFixed(2)}ms (p99)` };
}

/**
 * Checks heap memory usage against a configured threshold.
 * @returns The status and memory usage percentage.
 */
function checkMemoryUsage() {
	const { heapUsed, heapTotal } = process.memoryUsage();
	const usageRatio = heapUsed / heapTotal;

	if (usageRatio > READINESS_THRESHOLDS.HEAP_USAGE_PERCENT) {
		return { status: 'degraded', usage: `${(usageRatio * 100).toFixed(2)}%` };
	}
	return { status: 'ok', usage: `${(usageRatio * 100).toFixed(2)}%` };
}

/**
 * Readiness Probe Endpoint (`/readyz`)
 * Aggregates all readiness checks. Returns 200 OK if healthy, otherwise 503.
 * A 503 status tells the orchestrator to stop sending traffic to this instance.
 */
WebApp.rawConnectHandlers.use('/readyz', async (_req: IncomingMessage, res: ServerResponse) => {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('Content-Type', 'application/json');

	const checks = {
		memory: checkMemoryUsage(),
		eventLoop: checkEventLoopLag(),
	};

	const isReady = checks.memory.status === 'ok' && checks.eventLoop.status === 'ok';
	const statusCode = isReady ? 200 : 503;

	const body = {
		status: isReady ? 'ok' : 'unavailable',
		checks,
	};

	if (!isReady) {
		SystemLogger.warn({ msg: 'Readiness check failed', details: body });
	}

	res.writeHead(statusCode);
	res.end(JSON.stringify(body, null, 2));
});

