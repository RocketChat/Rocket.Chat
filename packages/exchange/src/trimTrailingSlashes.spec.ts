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

	it('never runs a regex, which backtracks quadratically on a long run of slashes', () => {
		const exec = jest.spyOn(RegExp.prototype, 'exec');

		try {
			trimTrailingSlashes('https://graph.microsoft.com///');
			expect(exec).not.toHaveBeenCalled();
		} finally {
			exec.mockRestore();
		}
	});
});
