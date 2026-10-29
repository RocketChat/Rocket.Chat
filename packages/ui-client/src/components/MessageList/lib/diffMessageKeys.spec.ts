import { classifyMessageKeysDiff, diffMessageKeys } from './diffMessageKeys';

const keys = (value: string) => (value ? value.split('') : []);

describe('diffMessageKeys', () => {
	it.each([
		['', '', { replaced: false }, 'none'],
		['abc', 'abc', {}, 'none'],
		['', 'abc', { replaced: true }, 'replace'],
		['abc', 'xyz', { replaced: true }, 'replace'],
		['abc', 'xyabc', { addedHead: 2 }, 'prepend'],
		['abc', 'bc', { removedHead: 1 }, 'prepend'],
		['abc', 'xbc', { removedHead: 1, addedHead: 1 }, 'prepend'],
		['abc', 'abcde', { addedTail: 2 }, 'append'],
		['abc', 'ab', { removedTail: 1 }, 'append'],
		['abc', 'xabcd', { addedHead: 1, addedTail: 1 }, 'prependAndAppend'],
		['abc', 'bcd', { removedHead: 1, addedTail: 1 }, 'prependAndAppend'],
		['abcd', 'abxd', { middleChanged: true }, 'reorder'],
		['abcd', 'acd', { middleChanged: true }, 'reorder'],
		['abc', 'acb', { middleChanged: true }, 'reorder'],
		['abc', 'abxc', { middleChanged: true }, 'reorder'],
	])('%p → %p', (previous, next, expected, change) => {
		const diff = diffMessageKeys(keys(previous), keys(next));

		expect(diff).toMatchObject(expected);
		expect(classifyMessageKeysDiff(diff)).toBe(change);
	});

	it('should count every key around the kept ones', () => {
		expect(diffMessageKeys(keys('cde'), keys('abcdefg'))).toEqual({
			removedHead: 0,
			addedHead: 2,
			addedTail: 2,
			removedTail: 0,
			middleChanged: false,
			replaced: false,
		});
	});
});
