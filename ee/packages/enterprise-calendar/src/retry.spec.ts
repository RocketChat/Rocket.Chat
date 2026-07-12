import { calculateBackoffMs, parseRetryAfterMs } from './retry';

describe('calendar retry policy', () => {
	it('uses bounded exponential backoff with jitter', () => {
		expect(calculateBackoffMs(3, { baseMs: 1_000, maxMs: 60_000, jitter: () => 0 })).toBe(4_000);
		expect(calculateBackoffMs(20, { baseMs: 1_000, maxMs: 60_000, jitter: () => 1 })).toBe(60_000);
	});

	it('honors Retry-After seconds and dates', () => {
		expect(parseRetryAfterMs('10', 0)).toBe(10_000);
		expect(parseRetryAfterMs('Thu, 01 Jan 1970 00:00:05 GMT', 1_000)).toBe(4_000);
	});
});
