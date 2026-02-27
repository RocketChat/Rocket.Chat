import { expect } from 'chai';

import { isRelativeURL } from '../../../../lib/utils/isRelativeURL';

describe('isRelativeURL', () => {
	const testCases = [
		['/', true],
		['test', true],
		['test/test', true],
		['.', true],
		['./test', true],
		['https://rocket.chat', false],
		['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', false],
	] as const;


	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = isRelativeURL(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
