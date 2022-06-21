import { expect } from 'chai';

import { isRTLScriptLanguage } from '../../../../../client/lib/utils/isRTLScriptLanguage';

describe('isRTLScriptLanguage', () => {
	const testCases = [
		['en', false],
		['ar', true],
		['dv', true],
		['fa', true],
		['he', true],
		['ku', true],
		['ps', true],
		['sd', true],
		['ug', true],
		['ur', true],
		['yi', true],
		['ar', true],
		['ar-LY', true],
		['dv-MV', true],
		['', false],
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = isRTLScriptLanguage(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
