import { createPredicateFromFilter } from './filter';

describe('createPredicateFromFilter', () => {
	it('matches simple equality', () => {
		const fn = createPredicateFromFilter({ foo: 'bar' });
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 'baz' })).toBe(false);
	});

	it('matches $in', () => {
		const fn = createPredicateFromFilter({ foo: { $in: ['a', 'b'] } });
		expect(fn({ foo: 'a' })).toBe(true);
		expect(fn({ foo: 'b' })).toBe(true);
		expect(fn({ foo: 'c' })).toBe(false);
	});

	it('matches $nin', () => {
		const fn = createPredicateFromFilter({ foo: { $nin: ['a', 'b'] } });
		expect(fn({ foo: 'a' })).toBe(false);
		expect(fn({ foo: 'c' })).toBe(true);
		expect(fn({})).toBe(true);
	});

	it('matches $all', () => {
		const fn = createPredicateFromFilter({ foo: { $all: ['a', 'b'] } });
		expect(fn({ foo: ['a', 'b', 'c'] })).toBe(true);
		expect(fn({ foo: ['a', 'c'] })).toBe(false);
	});

	it('matches $lt/$lte/$gt/$gte', () => {
		const fn = createPredicateFromFilter({ foo: { $lt: 5 } });
		expect(fn({ foo: 4 })).toBe(true);
		expect(fn({ foo: 5 })).toBe(false);
		const fn2 = createPredicateFromFilter({ foo: { $lte: 5 } });
		expect(fn2({ foo: 5 })).toBe(true);
		const fn3 = createPredicateFromFilter({ foo: { $gt: 5 } });
		expect(fn3({ foo: 6 })).toBe(true);
		const fn4 = createPredicateFromFilter({ foo: { $gte: 5 } });
		expect(fn4({ foo: 5 })).toBe(true);
	});

	it('matches $ne', () => {
		const fn = createPredicateFromFilter({ foo: { $ne: 1 } });
		expect(fn({ foo: 2 })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $exists', () => {
		const fn = createPredicateFromFilter({ foo: { $exists: true } });
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({})).toBe(false);
		const fn2 = createPredicateFromFilter({ foo: { $exists: false } });
		expect(fn2({ foo: 1 })).toBe(false);
		expect(fn2({})).toBe(true);
	});

	it('matches $mod', () => {
		const fn = createPredicateFromFilter({ foo: { $mod: [2, 0] } });
		expect(fn({ foo: 4 })).toBe(true);
		expect(fn({ foo: 5 })).toBe(false);
	});

	it('matches $size', () => {
		const fn = createPredicateFromFilter({ foo: { $size: 2 } });
		expect(fn({ foo: [1, 2] })).toBe(true);
		expect(fn({ foo: [1] })).toBe(false);
	});

	it('matches $type', () => {
		const fn = createPredicateFromFilter({ foo: { $type: 2 } });
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $regex', () => {
		const fn = createPredicateFromFilter({ foo: { $regex: '^b' } });
		expect(fn({ foo: 'bar' })).toBe(true);
		expect(fn({ foo: 'baz' })).toBe(true);
		expect(fn({ foo: 'car' })).toBe(false);
	});

	it('matches $elemMatch', () => {
		const fn = createPredicateFromFilter({ foo: { $elemMatch: { bar: 1 } } });
		expect(fn({ foo: [{ bar: 1 }, { bar: 2 }] })).toBe(true);
		expect(fn({ foo: [{ bar: 2 }] })).toBe(false);
	});

	it('matches $eq', () => {
		const fn = createPredicateFromFilter({ foo: { $eq: 1 } });
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('matches $not', () => {
		const fn = createPredicateFromFilter({ foo: { $not: { $eq: 1 } } });
		expect(fn({ foo: 2 })).toBe(true);
		expect(fn({ foo: 1 })).toBe(false);
	});

	it('matches $and', () => {
		const fn = createPredicateFromFilter({ $and: [{ foo: 1 }, { bar: 2 }] });
		expect(fn({ foo: 1, bar: 2 })).toBe(true);
		expect(fn({ foo: 1, bar: 3 })).toBe(false);
	});

	it('matches $or', () => {
		const fn = createPredicateFromFilter({ $or: [{ foo: 1 }, { bar: 2 }] });
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ bar: 2 })).toBe(true);
		expect(fn({ foo: 3, bar: 4 })).toBe(false);
	});

	it('matches $nor', () => {
		const fn = createPredicateFromFilter({ $nor: [{ foo: 1 }, { bar: 2 }] });
		expect(fn({ foo: 1 })).toBe(false);
		expect(fn({ bar: 2 })).toBe(false);
		expect(fn({ foo: 3, bar: 4 })).toBe(true);
	});

	it('matches $where (function)', () => {
		const fn = createPredicateFromFilter({
			$where(this: any) {
				return this.foo === 1;
			},
		});
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('matches $where (string)', () => {
		const fn = createPredicateFromFilter({ $where: 'this.foo === 1' });
		expect(fn({ foo: 1 })).toBe(true);
		expect(fn({ foo: 2 })).toBe(false);
	});

	it('handles undefined and null', () => {
		const fn = createPredicateFromFilter({ foo: undefined, bar: null });
		expect(fn({})).toBe(true);
		expect(fn({ foo: null, bar: null })).toBe(true);
		expect(fn({ foo: 1, bar: 2 })).toBe(false);
	});

	it('handles nested fields', () => {
		const fn = createPredicateFromFilter({ 'foo.bar': 1 });
		expect(fn({ foo: { bar: 1 } })).toBe(true);
		expect(fn({ foo: { bar: 2 } })).toBe(false);
	});

	it('handles arrays for $in/$all', () => {
		const fn = createPredicateFromFilter({ foo: { $in: [1, 2] }, bar: { $all: [3, 4] } });
		expect(fn({ foo: 1, bar: [3, 4, 5] })).toBe(true);
		expect(fn({ foo: 3, bar: [3, 4, 5] })).toBe(false);
	});

	it('returns true for empty filter', () => {
		const fn = createPredicateFromFilter({});
		expect(fn({})).toBe(true);
		expect(fn({ foo: 1 })).toBe(true);
	});

	it('handles multiple keys', () => {
		const fn = createPredicateFromFilter({ foo: 1, bar: 2 });
		expect(fn({ foo: 1, bar: 2 })).toBe(true);
		expect(fn({ foo: 1, bar: 3 })).toBe(false);
	});

	it('handles complex nested structures', () => {
		const fn = createPredicateFromFilter({ $or: [{ a: { $exists: false } }, { b: { $eq: true } }] });
		expect(fn({ a: undefined, b: true })).toBe(true);
		expect(fn({ a: '123', b: true })).toBe(true);
		expect(fn({ a: '123', b: false })).toBe(false);
		expect(fn({ a: undefined, b: false })).toBe(true);
	});

	it('throws error for unsupported operators', () => {
		expect(() => createPredicateFromFilter({ $unsupported: 'value' })).toThrow('Unrecognized logical operator: $unsupported');
	});
});
