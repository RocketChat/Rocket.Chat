import { expect } from 'chai';

import { convertPathsIntoSubObjects } from './convertPathsIntoSubObjects';
import { convertSubObjectsIntoPaths } from './convertSubObjectsIntoPaths';

describe('convertPathsIntoSubObjects', () => {
	it('should convert a simple flat object with no dot notation into itself', () => {
		const input = { a: 1, b: 2, c: 3 };
		const expected = { a: 1, b: 2, c: 3 };

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should expand dot-notated keys into nested objects', () => {
		const input = {
			'a': 1,
			'b.c': 2,
			'b.d.e': 3,
		};
		const expected = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should handle deeply nested dotted paths', () => {
		const input = {
			'a.b.c.d.e.f': 6,
		};
		const expected = {
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

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should handle objects with array values', () => {
		const input = {
			'a': [1, 2, 3],
			'b.c': [4, 5],
		};
		const expected = {
			a: [1, 2, 3],
			b: {
				c: [4, 5],
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should handle an empty object', () => {
		const input = {};
		const expected = {};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should preserve boolean false values', () => {
		const input = {
			'a.b': false,
			'a.c': true,
		};
		const expected = {
			a: {
				b: false,
				c: true,
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should ignore null, undefined, empty string, and other falsy non-boolean values', () => {
		const input = {
			'a': 1,
			'b.c': null,
			'b.d': undefined,
			'b.e': '',
			'b.f': 0,
		};
		const expected = {
			a: 1,
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should merge nested objects when multiple paths share intermediate keys', () => {
		const input = {
			'user.profile.name': 'John',
			'user.profile.age': 30,
			'user.settings.active': true,
		};
		const expected = {
			user: {
				profile: {
					name: 'John',
					age: 30,
				},
				settings: {
					active: true,
				},
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should correctly merge when an intermediate path has an object value', () => {
		const input = {
			'user.profile': { name: 'John' },
			'user.profile.age': 30,
		};
		const expected = {
			user: {
				profile: {
					name: 'John',
					age: 30,
				},
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should replace an intermediate non-object value with an object when a child path is encountered', () => {
		const input = {
			'a': 'primitive',
			'a.b': 2,
		};
		const expected = {
			a: {
				b: 2,
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should retain existing object properties when a non-object value targets an existing final property object', () => {
		const input = {
			'a.b': { c: 1 },
			'a': 'primitive',
		};
		const expected = {
			a: {
				b: { c: 1 },
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should be symmetric with convertSubObjectsIntoPaths for standard nested structures', () => {
		const original = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		};

		const flattened = convertSubObjectsIntoPaths(original);
		const restored = convertPathsIntoSubObjects(flattened);

		expect(restored).to.deep.equal(original);
	});
});
