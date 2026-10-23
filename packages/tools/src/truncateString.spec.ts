import { truncateString } from './truncateString';

describe('truncateString', () => {
	it.each([
		['hello😀world', 9, true, 'hello...'],
		['hello😀world', 6, false, 'hello'],
		['😀tail', 1, true, ''],
		['😀tail', 2, true, '😀'],
		['hello😀world', 10, true, 'hello😀...'],
		['abcdefgh', 6, true, 'abc...'],
		['short😀', 7, true, 'short😀'],
	] as const)('truncates %s to at most %i code units (ellipsis=%s)', (input, limit, ellipsis, expected) => {
		const result = truncateString(input, limit, ellipsis);
		expect(result).toBe(expected);
		expect(result.length).toBeLessThanOrEqual(limit);
		expect(Buffer.from(result).toString()).toBe(result);
	});
});
