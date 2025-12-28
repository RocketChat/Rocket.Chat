import { expect } from 'chai';

import { objectMap } from './objectMap';

describe('objectMap', () => {
	it('should map a simple object non-recursively', () => {
		const input = { a: 1, b: 2, c: 3 };
		const callback = ({ key, value }) => ({ key: key.toUpperCase(), value: value * 2 });
		const expected = { A: 2, B: 4, C: 6 };
		expect(objectMap(input, callback)).to.deep.equal(expected);
	});
	it('should filter out undefined results from callback', () => {
		const input = { a: 1, b: 2, c: 3 };
		const callback = ({ key, value }) => (value > 1 ? { key, value } : undefined);
		const expected = { b: 2, c: 3 };
		expect(objectMap(input, callback)).to.deep.equal(expected);
	});
	it('should map a nested object recursively', () => {
		const input = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		};
		const callback = ({ key, value }) => ({ key: `mapped_${key}`, value: typeof value === 'number' ? value * 10 : value });
		const expected = {
			mapped_a: 10,
			mapped_b: {
				mapped_c: 20,
				mapped_d: {
					mapped_e: 30,
				},
			},
		};
		expect(objectMap(input, callback, true)).to.deep.equal(expected);
	});
	it('should handle an empty object', () => {
		const input = {};
		const callback = ({ key, value }) => ({ key: `mapped_${key}`, value });
		const expected = {};
		expect(objectMap(input, callback)).to.deep.equal(expected);
	});
	it('should handle mixed value types in non-recursive mode', () => {
		const input = {
			a: 1,
			b: 'string',
			c: true,
			d: null,
		};
		const callback = ({ key, value }) => ({ key: key.toUpperCase(), value: typeof value === 'number' ? value * 2 : value });
		const expected = {
			A: 2,
			B: 'string',
			C: true,
			D: null,
		};
		expect(objectMap(input, callback)).to.deep.equal(expected);
	});
	it('should handle nested objects with mixed types recursively', () => {
		const input = {
			a: 1,
			b: {
				c: 'string',
				d: {
					e: true,
					f: null,
				},
			},
		};
		const callback = ({ key, value }) => ({ key: key.toUpperCase(), value });
		const expected = {
			A: 1,
			B: {
				C: 'string',
				D: {
					E: true,
					F: null,
				},
			},
		};
		expect(objectMap(input, callback, true)).to.deep.equal(expected);
	});
	it('should not modify the original object', () => {
		const input = { a: 1, b: 2 };
		const original = { ...input };
		const callback = ({ key, value }) => ({ key, value: value * 2 });
		objectMap(input, callback);
		expect(input).to.deep.equal(original);
	});
});
