import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { filterBusinessHoursThatMustBeOpened } from './filterBusinessHoursThatMustBeOpened';

describe('different timezones between server and business hours', () => {
	beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2024-04-20T20:10:11Z')));
	afterEach(() => jest.useRealTimers());
	it('should return a bh when the finish time resolves to a different day on server', async () => {
		const bh = await filterBusinessHoursThatMustBeOpened([
			{
				_id: '65c40fa9052d6750ae25df83',
				name: '',
				active: true,
				type: LivechatBusinessHourTypes.DEFAULT,
				workHours: [
					{
						day: 'Sunday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Saturday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Saturday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Sunday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Sunday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
				],
				timezone: {
					name: 'Asia/Kolkata',
					utc: '+05:30',
				},
				ts: new Date(),
			},
		]);

		expect(bh.length).toEqual(1);
	});
});
