import { createLookupFunction } from './lookups';

describe('createLookupFunction', () => {
	it('should lookup `a`', () => {
		const lookupA = createLookupFunction('a');
		expect(lookupA({})).toStrictEqual([undefined]);
		expect(lookupA({ a: 1 })).toStrictEqual([1]);
		expect(lookupA({ a: [1] })).toStrictEqual([[1]]);
	});

	it('should lookup `a.x`', () => {
		const lookupAX = createLookupFunction('a.x');
		expect(lookupAX({ a: { x: 1 } })).toStrictEqual([1]);
		expect(lookupAX({ a: { x: [1] } })).toStrictEqual([[1]]);
		expect(lookupAX({ a: 5 })).toStrictEqual([undefined]);
		expect(lookupAX({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toStrictEqual([1, [2], undefined]);
	});

	it('should lookup `a.0.x`', () => {
		const lookupA0X = createLookupFunction('a.0.x');
		expect(lookupA0X({ a: [{ x: 1 }] })).toStrictEqual([1, undefined]);
		expect(lookupA0X({ a: [{ x: [1] }] })).toStrictEqual([[1], undefined]);
		expect(lookupA0X({ a: 5 })).toStrictEqual([undefined]);
		expect(lookupA0X({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toStrictEqual([1, undefined, undefined, undefined]);
	});

	it('should lookup w.x.0.z`', () => {
		const lookupWX0Z = createLookupFunction('w.x.0.z');

		expect(lookupWX0Z({ w: [{ x: [{ z: 5 }] }] })).toStrictEqual([5, undefined]);
	});
});
