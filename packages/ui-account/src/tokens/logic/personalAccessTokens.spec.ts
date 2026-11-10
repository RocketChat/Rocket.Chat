import { getTokensPage, isValidTokenName } from './personalAccessTokens';

describe('isValidTokenName', () => {
	it.each([
		['', false],
		['   ', false],
		['ci', true],
		['  ci  ', true],
	])('%j -> %s', (name, expected) => {
		expect(isValidTokenName(name)).toBe(expected);
	});
});

describe('getTokensPage', () => {
	const tokens = [1, 2, 3, 4, 5];

	it('returns the requested page', () => {
		expect(getTokensPage(tokens, 2, 2)).toEqual([3, 4]);
	});

	it('falls back to the last page when the offset is past the end', () => {
		expect(getTokensPage(tokens, 10, 2)).toEqual([4, 5]);
	});

	it('never starts before the first item', () => {
		expect(getTokensPage(tokens, 10, 25)).toEqual(tokens);
	});
});
