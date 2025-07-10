import { compileFilter } from './filter';

describe('compileFilter', () => {
	it('matches simple equality', () => {
		const filter = { foo: 'bar' };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 'baz' })).toBe(false);
	});

	it('matches $in', () => {
		const filter = { foo: { $in: ['a', 'b'] } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 'a' })).toBe(true);
		expect(fn({ foo: 'b' })).toBe(true);
		expect(fn({ foo: 'c' })).toBe(false);
	});

	it('matches $nin', () => {
		const filter = { foo: { $nin: ['a', 'b'] } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 'a' })).toBe(false);
		expect(fn({ foo: 'c' })).toBe(true);
		expect(fn({})).toBe(true);
	});

	it('matches $all', () => {
		const filter = { foo: { $all: ['a', 'b'] } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: ['a', 'b', 'c'] })).toBe(true);
		expect(fn({ foo: ['a', 'c'] })).toBe(false);
	});

	it('matches $lt/$lte/$gt/$gte', () => {
		const filter = { foo: { $lt: 5 } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 4 })).toBe(true);
		expect(fn({ foo: 5 })).toBe(false);
		const filter2 = { foo: { $lte: 5 } };
		const fn2 = compileFilter<any>(filter2);
		expect(fn2({ foo: 5 })).toBe(true);
		const filter3 = { foo: { $gt: 5 } };
		const fn3 = compileFilter<any>(filter3);
		expect(fn3({ foo: 6 })).toBe(true);
		const filter4 = { foo: { $gte: 5 } };
		const fn4 = compileFilter<any>(filter4);
		expect(fn4({ foo: 5 })).toBe(true);
	});

	it('matches $ne', () => {
		const filter = { foo: { $ne: 1 } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 2 })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $exists', () => {
		const filter = { foo: { $exists: true } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({})).toBe(false);
		const filter2 = { foo: { $exists: false } };
		const fn2 = compileFilter<any>(filter2);
		expect(fn2({ foo: 1 })).toBe(false);
		expect(fn2({})).toBe(true);
	});

	it('matches $mod', () => {
		const filter = { foo: { $mod: [2, 0] } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 4 })).toBe(true);
		expect(fn({ foo: 5 })).toBe(false);
	});

	it('matches $size', () => {
		const filter = { foo: { $size: 2 } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: [1, 2] })).toBe(true);
		expect(fn({ foo: [1] })).toBe(false);
	});

	it('matches $type', () => {
		const filter = { foo: { $type: 2 } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $regex', () => {
		const filter = { foo: { $regex: '^b' } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 'baz' })).toBe(true);
		expect(fn({ foo: 'car' })).toBe(false);
	});

	it('matches $elemMatch', () => {
		const filter = { foo: { $elemMatch: { bar: 1 } } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: [{ bar: 1 }, { bar: 2 }] })).toBe(true);
		expect(fn({ foo: [{ bar: 2 }] })).toBe(false);
	});

	it('matches $eq', () => {
		const filter = { foo: { $eq: 1 } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('matches $not', () => {
		const filter = { foo: { $not: { $eq: 1 } } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 2 })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $and', () => {
		const filter = { $and: [{ foo: 1 }, { bar: 2 }] };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1, bar: 2 })).toBe(true);
		expect(fn({ foo: 1, bar: 3 })).toBe(false);
	});

	it('matches $or', () => {
		const filter = { $or: [{ foo: 1 }, { bar: 2 }] };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ bar: 2 })).toBe(true);
		expect(fn({ foo: 3, bar: 4 })).toBe(false);
	});

	it('matches $nor', () => {
		const filter = { $nor: [{ foo: 1 }, { bar: 2 }] };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(false);
		expect(fn({ bar: 2 })).toBe(false);
		expect(fn({ foo: 3, bar: 4 })).toBe(true);
	});

	it('matches $where (function)', () => {
		const filter = { $where: (doc: any) => doc.foo === 1 };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('matches $where (string)', () => {
		const filter = { $where: 'this.foo === 1' };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('handles undefined and null', () => {
		const filter = { foo: undefined, bar: null };
		const fn = compileFilter<any>(filter);
		expect(fn({})).toBe(true);
		expect(fn({ foo: null, bar: null })).toBe(true);
		expect(fn({ foo: 1, bar: 2 })).toBe(false);
	});

	it('handles nested fields', () => {
		const filter = { 'foo.bar': 1 };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: { bar: 1 } })).toBe(true);
		expect(fn({ foo: { bar: 2 } })).toBe(false);
	});

	it('handles arrays for $in/$all', () => {
		const filter = { foo: { $in: [1, 2] }, bar: { $all: [3, 4] } };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1, bar: [3, 4, 5] })).toBe(true);
		expect(fn({ foo: 3, bar: [3, 4, 5] })).toBe(false);
	});

	it('returns true for empty filter', () => {
		const fn = compileFilter<any>({});
		expect(fn({})).toBe(true);
		expect(fn({ foo: 1 })).toBe(true);
	});

	it('handles multiple keys', () => {
		const filter = { foo: 1, bar: 2 };
		const fn = compileFilter<any>(filter);
		expect(fn({ foo: 1, bar: 2 })).toBe(true);
		expect(fn({ foo: 1, bar: 3 })).toBe(false);
	});

	it('handles complex nested structures', () => {
		const filter = { $or: [{ a: { $exists: false } }, { b: { $eq: true } }] };
		const fn = compileFilter<any>(filter);
		expect(fn({ a: undefined, b: true })).toBe(true);
		expect(fn({ a: '123', b: true })).toBe(true);
		expect(fn({ a: '123', b: false })).toBe(false);
		expect(fn({ a: undefined, b: false })).toBe(true);
	});

	it('throws error for unsupported operators', () => {
		const filter = { $unsupported: 'value' };
		expect(() => compileFilter<any>(filter)).toThrow('Unrecognized logical operator: $unsupported');
	});
});
