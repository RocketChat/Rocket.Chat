import { expect } from 'chai';

import { convertPathsIntoSubObjects } from './convertPathsIntoSubObjects';

describe('convertPathsIntoSubObjects', () => {
	it('should return an empty object when given an empty object', () => {
		expect(convertPathsIntoSubObjects({})).to.deep.equal({});
	});

	it('should convert flat paths into nested objects', () => {
		const input = {
			'a.b.c': 1,
			'a.b.d': 2,
			'e': 3,
		};
		const expected = {
			a: {
				b: {
					c: 1,
					d: 2,
				},
			},
			e: 3,
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should preserve falsy values like 0, empty string, null, and false', () => {
		const input = {
			'number': 0,
			'emptyString': '',
			'nullValue': null,
			'booleanFalse': false,
			'nested.number': 0,
			'nested.emptyString': '',
			'nested.nullValue': null,
			'nested.booleanFalse': false,
		};
		const expected = {
			number: 0,
			emptyString: '',
			nullValue: null,
			booleanFalse: false,
			nested: {
				number: 0,
				emptyString: '',
				nullValue: null,
				booleanFalse: false,
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should skip undefined values', () => {
		const input = {
			'a': 1,
			'b.c': undefined,
			'd': undefined,
		};
		const expected = {
			a: 1,
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});

	it('should merge nested objects when paths overlap', () => {
		const input = {
			'a.b': { c: 1 },
			'a.b.d': 2,
		};
		const expected = {
			a: {
				b: {
					c: 1,
					d: 2,
				},
			},
		};

		expect(convertPathsIntoSubObjects(input)).to.deep.equal(expected);
	});
});
