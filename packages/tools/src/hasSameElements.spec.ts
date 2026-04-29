import { hasSameElements } from './hasSameElements';

describe('hasSameElements', () => {
	test.each<[string, unknown[] | undefined, unknown[] | undefined, boolean]>([
		['both empty', [], [], true],
		['both undefined', undefined, undefined, true],
		['one empty, one undefined', [], undefined, true],
		['same single element', ['a'], ['a'], true],
		['same order', ['a', 'b', 'c'], ['a', 'b', 'c'], true],
		['different order', ['a', 'b', 'c'], ['c', 'a', 'b'], true],
		['numbers same', [1, 2, 3], [3, 2, 1], true],
		['different length', ['a', 'b'], ['a', 'b', 'c'], false],
		['one empty vs non-empty', [], ['a'], false],
		['disjoint sets', ['a'], ['b'], false],
		['partial overlap', ['a', 'b'], ['a', 'c'], false],
		['duplicate in one', ['a', 'a'], ['a', 'b'], false],
		['same type mismatch', [1, 2], ['1', '2'], false],
	])('%s', (_label, a, b, expected) => {
		expect(hasSameElements(a as any, b as any)).toBe(expected);
	});

	it('is symmetric', () => {
		expect(hasSameElements(['a', 'b'], ['b', 'a'])).toBe(hasSameElements(['b', 'a'], ['a', 'b']));
	});

	it('uses strict equality for references', () => {
		const objA = { id: 1 };
		const objB = { id: 1 };
		expect(hasSameElements([objA], [objA])).toBe(true);
		expect(hasSameElements([objA], [objB])).toBe(false);
	});
});
