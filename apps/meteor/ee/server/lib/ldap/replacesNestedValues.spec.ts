import { expect } from 'chai';

import { replacesNestedValues } from './replacesNestedValues';

describe('LDAP replacesNestedValues', () => {
	it('should replace shallow values', () => {
		const result = replacesNestedValues(
			{
				a: 1,
			},
			'a',
			2,
		);
		expect(result).to.eql({
			a: 2,
		});
	});

	it('should replace undefined values', () => {
		const result = replacesNestedValues({}, 'a', 2);
		expect(result).to.eql({
			a: 2,
		});
	});

	it('should replace nested values', () => {
		const result = replacesNestedValues(
			{
				a: {
					b: 1,
				},
			},
			'a.b',
			2,
		);
		expect(result).to.eql({
			a: {
				b: 2,
			},
		});
	});
	it('should replace undefined nested values', () => {
		const result = replacesNestedValues(
			{
				a: {},
			},
			'a.b',
			2,
		);
		expect(result).to.eql({
			a: {
				b: 2,
			},
		});
	});

	it('should fail if the value being replaced is not an object', () => {
		expect(() =>
			replacesNestedValues(
				{
					a: [],
				},
				'a.b',
				2,
			),
		).to.throw();
		expect(() =>
			replacesNestedValues(
				{
					a: 1,
				},
				'a.b',
				2,
			),
		).to.throw();

		expect(() =>
			replacesNestedValues(
				{
					a: { b: [] },
				},
				'a.b',
				2,
			),
		).to.throw();
	});
});
