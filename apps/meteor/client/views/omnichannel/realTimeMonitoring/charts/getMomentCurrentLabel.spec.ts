import moment from 'moment-timezone';

import { getMomentCurrentLabel } from './getMomentCurrentLabel';

moment.tz.setDefault('UTC');

describe.each([
	['en', '12PM-1PM'],
	/** @see: https://github.com/RocketChat/Rocket.Chat/issues/30191 */
	['fa', '۱۲بعد از ظهر-۱بعد از ظهر'],
])(`%p language`, (language, expectedLabel) => {
	beforeEach(() => {
		moment.locale(language);
	});

	it('should create timing labels from midnight to noon', () => {
		const label = getMomentCurrentLabel(12 * 60 * 60 * 1000);
		expect(label).toStrictEqual(expectedLabel);
	});
});
