import { expect } from 'chai';

import { normalizeUsername } from '../../../../lib/utils/normalizeUsername';

describe('normalizeUsername', () => {
	const testCases = [
		['john.doe', 'john.doe'],
		['@john.doe:matrix.org', 'john.doe:matrix.org'],
		['@john', 'john'],
		['@@john', '@john'],
		['john@doe', 'john@doe'],
		['', ''],
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = normalizeUsername(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
