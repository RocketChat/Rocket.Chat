import { expect } from 'chai';

import { isValidLink } from '../../../../../../../client/views/room/MessageList/lib/isValidLink';

describe('isValidLink', () => {
	const testCases = [
		['/', false],
		['test', false],
		['test/test', false],
		['.', false],
		['./test', false],
		['https://rocket.chat', true],
		['rocket.chat', false],
		['data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAAsBAAEAAAICTAEAOw==', true],
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = isValidLink(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
