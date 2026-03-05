import { expect } from 'chai';

import { isAbsoluteURL } from '../../../../lib/utils/isURL';

describe('isAbsoluteURL', () => {
	const testCases = [
		['/', false],
		['test', false],
		['test/test', false],
		['.', false],
		['./test', false],
		['https://rocket.chat', true],
		['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', true],
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = isAbsoluteURL(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
