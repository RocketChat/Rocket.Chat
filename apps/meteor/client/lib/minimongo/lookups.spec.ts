import { createLookupFunction } from './lookups';

describe('createLookupFunction', () => {
	it('should work', () => {
		expect(createLookupFunction('a.x')({ a: { x: 1 } })).toStrictEqual([1]);
		expect(createLookupFunction('a.x')({ a: { x: [1] } })).toStrictEqual([[1]]);
		expect(createLookupFunction('a.x')({ a: 5 })).toStrictEqual([undefined]);
		expect(createLookupFunction('a.x')({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toStrictEqual([1, [2], undefined]);
	});
});
