import { expect } from 'chai';

import { isRelativeURL } from '../../../../lib/utils/isRelativeURL';

describe('isRelativeURL', () => {
	const testCases = [
		['/', false],
		['test', false], // TODO: should be true?
		['test/test', true],
		['.', false], // TODO: should be true?
		['./test', true],
		['https://rocket.chat', false],
		['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', true], // TODO: should be false?
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = isRelativeURL(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
