import { expect } from 'chai';

import { convertSubObjectsIntoPaths } from './convertSubObjectsIntoPaths';

describe('convertSubObjectsIntoPaths', () => {
	it('should flatten a simple object with no nested structure', () => {
		const input = { a: 1, b: 2, c: 3 };
		const expected = { a: 1, b: 2, c: 3 };

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should flatten a nested object into paths', () => {
		const input = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		};
		const expected = {
			'a': 1,
			'b.c': 2,
			'b.d.e': 3,
		};

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should handle objects with array values', () => {
		const input = {
			a: [1, 2, 3],
			b: {
				c: [4, 5],
			},
		};
		const expected = {
			'a': [1, 2, 3],
			'b.c': [4, 5],
		};

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should handle deeply nested objects', () => {
		const input = {
			a: {
				b: {
					c: {
						d: {
							e: {
								f: 6,
							},
						},
					},
				},
			},
		};
		const expected = {
			'a.b.c.d.e.f': 6,
		};

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should handle an empty object', () => {
		const input = {};
		const expected = {};

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should handle objects with mixed types of values', () => {
		const input = {
			a: 1,
			b: 'string',
			c: true,
			d: {
				e: null,
				f: undefined,
				g: {
					h: 2,
				},
			},
		};
		const expected = {
			'a': 1,

			'b': 'string',

			'c': true,
			'd.e': null,
			'd.f': undefined,
			'd.g.h': 2,
		};

		expect(convertSubObjectsIntoPaths(input)).to.deep.equal(expected);
	});

	it('should respect the parentPath parameter', () => {
		const input = {
			a: 1,
			b: {
				c: 2,
			},
		};
		const parentPath = 'root';
		const expected = {
			'root.a': 1,
			'root.b.c': 2,
		};

		expect(convertSubObjectsIntoPaths(input, parentPath)).to.deep.equal(expected);
	});
});
