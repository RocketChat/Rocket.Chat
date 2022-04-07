/* eslint-env mocha */
import { expect } from 'chai';

import { sortAppsByAlphabeticalOrInverseOrder } from '../../../../../../../client/views/admin/apps/helpers/sortAppsByAlphabeticalOrInverseOrder';

describe('sortAppsByAlphabeticalOrder', () => {
	it.skip('should return a positive number if first word is, alphabetically, after second word', () => {
		const firstWord = 'Alfa';
		const secondWord = 'Bravo';

		const result = sortAppsByAlphabeticalOrInverseOrder(firstWord, secondWord);

		expect(result).to.be.above(0);
	});
	it.skip('should return a negative number if first word is, alphabetically, before second word', () => {
		const firstWord = 'Bravo';
		const secondWord = 'Alfa';

		const result = sortAppsByAlphabeticalOrInverseOrder(firstWord, secondWord);

		expect(result).to.be.below(0);
	});
	it('should return 0 if the words are the equivalent', () => {
		const firstWord = 'Alfa';
		const secondWord = 'Alfa';

		const result = sortAppsByAlphabeticalOrInverseOrder(firstWord, secondWord);

		expect(result).to.be.equal(0);
	});
});
