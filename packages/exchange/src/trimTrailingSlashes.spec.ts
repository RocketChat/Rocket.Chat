import { trimTrailingSlashes } from './trimTrailingSlashes';

describe('trimTrailingSlashes', () => {
	it.each([
		['https://graph.microsoft.com', 'https://graph.microsoft.com'],
		['https://graph.microsoft.com/', 'https://graph.microsoft.com'],
		['https://graph.microsoft.com///', 'https://graph.microsoft.com'],
		['', ''],
		['///', ''],
	])('turns %j into %j', (value, expected) => {
		expect(trimTrailingSlashes(value)).toBe(expected);
	});

	it('keeps slashes that are not at the end', () => {
		expect(trimTrailingSlashes('https://graph.microsoft.com/v1.0//users/')).toBe('https://graph.microsoft.com/v1.0//users');
	});

	it('returns in milliseconds for 16M slashes followed by another character', () => {
		const value = `${'/'.repeat(16 * 1024 * 1024)}x`;

		const startedAt = performance.now();
		const result = trimTrailingSlashes(value);
		const elapsedMs = performance.now() - startedAt;

		expect(result).toBe(value);
		expect(elapsedMs).toBeLessThan(100);
	});
});
