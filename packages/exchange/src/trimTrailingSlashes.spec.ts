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

	// A backtracking regex runs for hours on this input, so a regression fails as a CI timeout rather than an assertion.
	it('leaves 16M slashes followed by another character untouched', () => {
		const value = `${'/'.repeat(16 * 1024 * 1024)}x`;

		expect(trimTrailingSlashes(value)).toBe(value);
	});
});
