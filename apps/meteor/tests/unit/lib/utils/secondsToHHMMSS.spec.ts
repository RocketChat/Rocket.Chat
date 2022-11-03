import { expect } from 'chai';

import { secondsToHHMMSS } from '../../../../lib/utils/secondsToHHMMSS';

describe('secondsToHHMMSS', () => {
	const testCases = [
		[0, '00:00:00'],
		[1, '00:00:01'],
		[60, '00:01:00'],
		[61, '00:01:01'],
		[3600, '01:00:00'],
		[3601, '01:00:01'],
		[3661, '01:01:01'],
		[3661.1, '01:01:01'],
		[3661.9, '01:01:02'], // rounding down?
		[3662, '01:01:02'],
		[86400, '24:00:00'],
		[172800, '48:00:00'],
		[360000, '100:00:00'], // should exceed 8 characters?
	] as const;

	testCases.forEach(([parameter, expectedResult]) => {
		it(`should return ${JSON.stringify(expectedResult)} for ${JSON.stringify(parameter)}`, () => {
			const result = secondsToHHMMSS(parameter);
			expect(result).to.be.equal(expectedResult);
		});
	});
});
