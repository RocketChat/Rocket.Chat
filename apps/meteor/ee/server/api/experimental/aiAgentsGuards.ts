import type { MiddlewareHandler } from 'hono';

import type { AiEngineVariables } from './aiAgentsEngineAuth';

export const MAX_MANAGEMENT_BODY_BYTES = 128 * 1024;
export const MAX_ENGINE_REPORT_BODY_BYTES = 256 * 1024;

export const MANAGEMENT_WRITE_RATE_LIMIT = {
	numRequestsAllowed: 30,
	intervalTimeInMS: 60_000,
};

export const ENGINE_READ_RATE_LIMIT = {
	numRequestsAllowed: 240,
	intervalTimeInMS: 60_000,
};

export const ENGINE_REPORT_RATE_LIMIT = {
	numRequestsAllowed: 12,
	intervalTimeInMS: 60_000,
};

export class BodyTooLargeError extends Error {
	constructor() {
		super('error-payload-too-large');
		this.name = 'BodyTooLargeError';
	}
}

/**
 * Reads a Web Request body up to `maxBytes` BEFORE any JSON parsing, enforcing the cap both
 * via `Content-Length` (when present) and by counting streamed bytes (when chunked / without `Content-Length`).
 */
export async function readBoundedBodyBuffer(request: Request, maxBytes: number): Promise<Buffer> {
	const contentLength = request.headers.get('content-length');
	if (contentLength !== null) {
		const parsed = Number(contentLength);
		if (Number.isFinite(parsed) && parsed > maxBytes) {
			throw new BodyTooLargeError();
		}
	}

	if (!request.body) {
		return Buffer.alloc(0);
	}

	const reader = request.body.getReader();
	const chunks: Buffer[] = [];
	let total = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel().catch(() => undefined);
				throw new BodyTooLargeError();
			}
			chunks.push(Buffer.from(value));
		}
	} finally {
		reader.releaseLock();
	}

	return Buffer.concat(chunks, total);
}

/**
 * Pre-parse body size middleware for AI agents experimental POST routes.
 * Applies 256 KiB to `ai-agents.engine.report` and 128 KiB to all other `ai-agents.*` POST routes.
 * Clones the request stream so valid payloads remain readable by downstream parsers while oversized
 * payloads (with or without `Content-Length`) are rejected with 413 before JSON.parse runs.
 */
export function createAiAgentsBodyLimitMiddleware(): MiddlewareHandler {
	return async (c, next) => {
		if (c.req.method !== 'POST') {
			return next();
		}

		const isEngineReport = c.req.path.endsWith('/ai-agents.engine.report');
		const maxBytes = isEngineReport ? MAX_ENGINE_REPORT_BODY_BYTES : MAX_MANAGEMENT_BODY_BYTES;

		const contentLength = c.req.raw.headers.get('content-length');
		if (contentLength !== null) {
			const parsed = Number(contentLength);
			if (Number.isFinite(parsed) && parsed > maxBytes) {
				return c.json({ success: false, error: 'Payload too large', errorType: 'error-payload-too-large' }, 413, {
					'Cache-Control': 'no-store',
				});
			}
		}

		try {
			await readBoundedBodyBuffer(c.req.raw.clone(), maxBytes);
		} catch (error) {
			if (error instanceof BodyTooLargeError) {
				return c.json({ success: false, error: 'Payload too large', errorType: 'error-payload-too-large' }, 413, {
					'Cache-Control': 'no-store',
				});
			}
			throw error;
		}

		return next();
	};
}

type RateBucket = {
	timestamps: number[];
};

export type AiEngineRateLimiter = {
	middleware: (
		routeKey: string,
		limit: { numRequestsAllowed: number; intervalTimeInMS: number },
	) => MiddlewareHandler<{
		Variables: AiEngineVariables & { remoteAddress?: string };
	}>;
	reset: () => void;
};

/**
 * Fixed-window sliding-timestamp rate limiter for bearer-authenticated engine routes.
 * Runs after engine authentication (keyed by engineId + IP) and responds 429 with `Cache-Control: no-store`.
 */
export function createAiEngineRateLimiter(nowMs: () => number = Date.now): AiEngineRateLimiter {
	const buckets = new Map<string, RateBucket>();

	return {
		middleware(routeKey, { numRequestsAllowed, intervalTimeInMS }) {
			return async (c, next) => {
				const now = nowMs();
				const engineId = c.get('aiEngineId') ?? 'anonymous';
				const remoteIp = c.get('remoteAddress') ?? 'unknown';
				const key = `${routeKey}:${engineId}:${remoteIp}`;

				const cutoff = now - intervalTimeInMS;
				let bucket = buckets.get(key);
				if (!bucket) {
					bucket = { timestamps: [] };
					buckets.set(key, bucket);
				}

				bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);
				if (bucket.timestamps.length >= numRequestsAllowed) {
					const oldest = bucket.timestamps[0] ?? now;
					const retryAfterSeconds = Math.max(1, Math.ceil((oldest + intervalTimeInMS - now) / 1000));
					return c.json({ success: false, error: 'Too many requests', errorType: 'error-too-many-requests' }, 429, {
						'Retry-After': String(retryAfterSeconds),
						'Cache-Control': 'no-store',
					});
				}

				bucket.timestamps.push(now);
				return next();
			};
		},
		reset() {
			buckets.clear();
		},
	};
}
