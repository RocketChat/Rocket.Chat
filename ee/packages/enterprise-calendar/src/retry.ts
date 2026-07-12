import { randomInt } from 'node:crypto';

export const calculateBackoffMs = (
	retryCount: number,
	options: { baseMs?: number; maxMs?: number; retryAfterMs?: number; jitter?: () => number } = {},
): number => {
	const { baseMs = 1_000, maxMs = 15 * 60_000, retryAfterMs, jitter = () => randomInt(0, 1_001) / 1_000 } = options;
	if (retryAfterMs != null) return Math.min(Math.max(retryAfterMs, 0), maxMs);
	const exponential = Math.min(baseMs * 2 ** Math.min(Math.max(retryCount, 0), 16), maxMs);
	return Math.round(exponential * (0.5 + jitter() * 0.5));
};

export const parseRetryAfterMs = (value: string | null, now = Date.now()): number | undefined => {
	if (!value) return undefined;
	if (/^\d+$/.test(value)) return Number(value) * 1_000;
	const at = Date.parse(value);
	return Number.isNaN(at) ? undefined : Math.max(at - now, 0);
};
