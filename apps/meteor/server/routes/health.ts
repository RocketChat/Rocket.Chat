import type { IncomingMessage, ServerResponse } from 'http';
import type { Process } from 'node:process';
import { monitorEventLoopDelay } from 'perf_hooks';

import { WebApp } from 'meteor/webapp';

import { SystemLogger } from '../lib/logger/system';

/**
 * DEPRECATED Liveness Probe (`/health`)
 * Maintained for backward compatibility. Behaves like a simple liveness probe.
 * @deprecated Update infrastructure to use /livez and /readyz.
 */
WebApp.rawConnectHandlers.use('/health', (_req: IncomingMessage, res: ServerResponse) => {
	SystemLogger.info('Deprecated /health endpoint was called. Please update to /livez or /readyz.');
	// Set headers to prevent any caching of the health check response.
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('Content-Type', 'application/json');

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
	EVENT_LOOP_LAG_MS: Number(process.env.EVENT_LOOP_LAG_MS ?? '') || 70,
	HEAP_USAGE_PERCENT: Number(process.env.HEAP_USAGE_PERCENT ?? '') || 0.85, // 85%
};

/**
 * Checks event loop lag. Can optionally reset the histogram after reading.
 * @param shouldReset - If true, resets the histogram for the next measurement interval.
 * @returns The status and p99 lag.
 */
function checkEventLoopLag(shouldReset: boolean) {
	const lagInNs = eventLoopHistogram.percentile(99);
	const lagInMs = lagInNs / 1_000_000;

	if (shouldReset) {
		eventLoopHistogram.reset();
	}

	const lagValue = parseFloat(lagInMs.toFixed(2));

	if (lagInMs > READINESS_THRESHOLDS.EVENT_LOOP_LAG_MS) {
		return { status: 'degraded', lag: lagValue, unit: 'ms (p99)' };
	}
	return { status: 'ok', lag: lagValue, unit: 'ms (p99)' };
}

/**
 * Checks heap memory usage against a configured threshold.
 * @returns The status and memory usage percentage.
 */
function checkMemoryUsage() {
	const { heapUsed, heapTotal } = (process as Process).memoryUsage();
	const usageRatio = heapUsed / heapTotal;
	const usageValue = parseFloat((usageRatio * 100).toFixed(2));

	if (usageRatio > READINESS_THRESHOLDS.HEAP_USAGE_PERCENT) {
		return { status: 'degraded', usage: usageValue, unit: '%' };
	}
	return { status: 'ok', usage: usageValue, unit: '%' };
}

/**
 * Performs the core health checks (memory, event loop) and returns the result.
 * @param shouldResetHistogram - Controls whether the event loop histogram is reset.
 */
function performHealthChecks(shouldResetHistogram: boolean) {
	const checks = {
		memory: checkMemoryUsage(),
		eventLoop: checkEventLoopLag(shouldResetHistogram),
	};

	const isHealthy = checks.memory.status === 'ok' && checks.eventLoop.status === 'ok';
	const statusCode = isHealthy ? 200 : 503;

	const body = {
		status: isHealthy ? 'ok' : 'unavailable',
		checks,
	};

	return { statusCode, body, isHealthy };
}

/**
 * Liveness Probe (`/livez`)
 * Performs a non-destructive health check. A failure here indicates a pod is
 * unrecoverable and should be restarted.
 */
WebApp.rawConnectHandlers.use('/livez', async (_req: IncomingMessage, res: ServerResponse) => {
	const { statusCode, body, isHealthy } = performHealthChecks(false); // Does NOT reset histogram

	if (!isHealthy) {
		SystemLogger.error({ msg: 'Liveness check failed', details: body });
	}

	res.setHeader('Content-Type', 'application/json');
	res.writeHead(statusCode);
	res.end(JSON.stringify(body, null, 2));
});

/**
 * Readiness Probe Endpoint (`/readyz`)
 * Performs a destructive health check, resetting the histogram for the next interval.
 * A failure tells the orchestrator to stop sending traffic to this instance.
 */
WebApp.rawConnectHandlers.use('/readyz', async (_req: IncomingMessage, res: ServerResponse) => {
	const { statusCode, body, isHealthy } = performHealthChecks(true); // DOES reset histogram

	if (!isHealthy) {
		SystemLogger.warn({ msg: 'Readiness check failed', details: body });
	}

	res.setHeader('Content-Type', 'application/json');
	res.writeHead(statusCode);
	res.end(JSON.stringify(body, null, 2));
});
