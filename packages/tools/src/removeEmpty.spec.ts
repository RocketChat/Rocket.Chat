import { removeEmpty } from './removeEmpty';

describe('removeEmpty', () => {
	it('should remove null props', () => {
		const obj = { a: 1, b: null };

		expect(removeEmpty(obj)).toEqual({ a: 1 });
	});

	it('should remove undefined props', () => {
		const obj = { a: 1, b: undefined };

		expect(removeEmpty(obj)).toEqual({ a: 1 });
	});

	it('should not remove empty strings', () => {
		const obj = { a: 1, b: '' };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: '' });
	});

	it('should not remove empty arrays', () => {
		const obj = { a: 1, b: [] };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: [] });
	});

	it('should not remove empty objects', () => {
		const obj = { a: 1, b: {} };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: {} });
	});

	it('should not remove 0', () => {
		const obj = { a: 1, b: 0 };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: 0 });
	});

	it('should not remove false', () => {
		const obj = { a: 1, b: false };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: false });
	});

	it('should not remove NaN', () => {
		const obj = { a: 1, b: NaN };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: NaN });
	});

	it('should not remove Infinity', () => {
		const obj = { a: 1, b: Infinity };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: Infinity });
	});

	it('should not remove functions', () => {
		const fn = () => {
			// noop
		};

		const obj = {
			a: 1,
			fn,
		};

		expect(removeEmpty(obj)).toEqual({
			a: 1,
			fn,
		});
	});

	it('should not remove symbols', () => {
		const b = Symbol('test');

		const obj = { a: 1, b };

		expect(removeEmpty(obj)).toEqual({ a: 1, b });
	});

	it('should not remove objects with non-empty props', () => {
		const obj = { a: 1, b: { c: 2 } };

		expect(removeEmpty(obj)).toEqual({ a: 1, b: { c: 2 } });
	});
});
