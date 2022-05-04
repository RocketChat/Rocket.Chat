import { expect } from 'chai';

import { truncate } from './stringUtils';

describe('String utils', () => {
	it('should return an empty string when the specified string is empty', () => {
		expect(truncate('', 10)).to.be.equal('');
	});

	it('should truncate a larger string', () => {
		expect(truncate('this text has a few words', 9)).to.be.equal('this t...');
	});

	it('should not truncate a smaller string', () => {
		expect(truncate('this', 9)).to.be.equal('this');
	});

	it('should not truncate a string with the exact length', () => {
		expect(truncate('this', 4)).to.be.equal('this');
	});
});
