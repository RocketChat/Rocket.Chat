import { createLookupFunction } from './lookups';

describe('createLookupFunction', () => {
	it('should lookup `a`', () => {
		const lookupA = createLookupFunction('a');
		expect(lookupA({})).toStrictEqual([{ value: undefined }]);
		expect(lookupA({ a: 1 })).toStrictEqual([{ value: 1 }]);
		expect(lookupA({ a: [1] })).toStrictEqual([{ value: [1] }]);
	});

	it('should lookup `a.x`', () => {
		const lookupAX = createLookupFunction('a.x');
		expect(lookupAX({ a: { x: 1 } })).toStrictEqual([{ value: 1 }]);
		expect(lookupAX({ a: { x: [1] } })).toStrictEqual([{ value: [1] }]);
		expect(lookupAX({ a: 5 })).toStrictEqual([{ value: undefined }]);
		expect(lookupAX({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toStrictEqual([
			{ value: 1, arrayIndices: [0] },
			{ value: [2], arrayIndices: [1] },
			{ value: undefined, arrayIndices: [2] },
		]);
	});

	it('should lookup `a.0.x`', () => {
		const lookupA0X = createLookupFunction('a.0.x');
		expect(lookupA0X({ a: [{ x: 1 }] })).toStrictEqual([
			{ value: 1, arrayIndices: [0, 'x'] },
			{ value: undefined, arrayIndices: [0] },
		]);
		expect(lookupA0X({ a: [{ x: [1] }] })).toStrictEqual([
			{ value: [1], arrayIndices: [0, 'x'] },
			{ value: undefined, arrayIndices: [0] },
		]);
		expect(lookupA0X({ a: 5 })).toStrictEqual([{ value: undefined }]);
		expect(lookupA0X({ a: [{ x: 1 }, { x: [2] }, { y: 3 }] })).toStrictEqual([
			{ value: 1, arrayIndices: [0, 'x'] },
			{ value: undefined, arrayIndices: [0] },
			{ value: undefined, arrayIndices: [1] },
			{ value: undefined, arrayIndices: [2] },
		]);
	});

	it('should lookup w.x.0.z`', () => {
		const lookupWX0Z = createLookupFunction('w.x.0.z');

		expect(lookupWX0Z({ w: [{ x: [{ z: 5 }] }] })).toStrictEqual([
			{ value: 5, arrayIndices: [0, 0, 'x'] },
			{ value: undefined, arrayIndices: [0, 0] },
		]);
	});

	describe('with options.forSort', () => {
		it('should lookup `w.x.0.z` for sort', () => {
			const lookupWX0ZForSort = createLookupFunction('w.x.0.z', { forSort: true });

			expect(lookupWX0ZForSort({ w: [{ x: [{ z: 5 }] }] })).toStrictEqual([{ value: 5, arrayIndices: [0, 0, 'x'] }]);
		});
	});
});
