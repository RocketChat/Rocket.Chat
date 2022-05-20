import { expect } from 'chai';

import { ensureArray } from '../../../../lib/utils/arrayUtils';

describe('Array utils', () => {
	it('should return an array with one item', () => {
		const value = 'value';
		const result = ensureArray(value);

		expect(result).to.be.an('Array').with.lengthOf(1).and.eql([value]);
	});

	it('should return a new array with the same items', () => {
		const value = ['value1', 'value2'];
		const result = ensureArray(value);

		expect(result).to.be.an('Array').with.lengthOf(2).and.eql(value).and.not.equal(value);
	});
});
