import { expect } from 'chai';

import { isURL } from '../../../../lib/utils/isURL';

describe('isURL', () => {
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
			const result = isURL(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
