import { expect } from 'chai';

import { convertValue } from '../../../../../../app/settings/server/functions/convertValue';

describe('convertValue', () => {
	it('should return true', () => {
		const value = convertValue('TRUE', 'string');
		expect(value).to.be.true;
	});

	it('should return false', () => {
		const value = convertValue('FaLSe', 'string');
		expect(value).to.be.false;
	});

	it('should return integer', () => {
		const value = convertValue('5234', 'int');
		expect(value).to.be.equal(5234);
	});

	it('should return NaN', () => {
		const value = convertValue('he423oo', 'int');
		expect(value).to.be.NaN;
	});
});
