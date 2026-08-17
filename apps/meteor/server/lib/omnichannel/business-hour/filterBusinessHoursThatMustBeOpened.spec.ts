import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { filterBusinessHoursThatMustBeOpened } from './filterBusinessHoursThatMustBeOpened';

describe('different timezones between server and business hours saturday ', () => {
	beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2024-04-20T20:10:11Z')));
	afterEach(() => jest.useRealTimers());
	it('should return a bh when the finish time resolves to a different day on server', async () => {
		const bh = await filterBusinessHoursThatMustBeOpened([
			{
				_id: '65c40fa9052d6750ae25df83',
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
			},
		]);

		expect(bh.length).toEqual(1);
	});
});

describe('different timezones between server and business hours sunday ', () => {
	beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2025-07-27T11:02:11Z')));
	afterEach(() => jest.useRealTimers());
	it('should return a bh when the finish time resolves to a different day on server', async () => {
		const bh = await filterBusinessHoursThatMustBeOpened([
			{
				_id: '68516f256ebb4bdceda2757e',
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
					{
						day: 'Monday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Sunday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Sunday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Monday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Monday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Tuesday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Monday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Monday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Tuesday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Tuesday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Wednesday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Tuesday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Tuesday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Wednesday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Wednesday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Thursday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Wednesday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Wednesday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Thursday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Thursday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Friday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Thursday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Thursday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Friday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Friday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Saturday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Friday',
								time: '18:30',
							},
							cron: {
								dayOfWeek: 'Friday',
								time: '15:30',
							},
						},
						finish: {
							time: '23:59',
							utc: {
								dayOfWeek: 'Saturday',
								time: '18:29',
							},
							cron: {
								dayOfWeek: 'Saturday',
								time: '15:29',
							},
						},
						open: true,
						code: '',
					},
				],
			},
		]);

		expect(bh.length).toEqual(1);
	});
});

describe('regular business hours', () => {
	beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2025-08-07T22:02:11Z')));
	afterEach(() => jest.useRealTimers());
	it('should return a bh when the finish time resolves to a different day on server', async () => {
		const bh = await filterBusinessHoursThatMustBeOpened([
			{
				_id: '68516f256ebb4bdceda2757e',
				active: true,
				type: LivechatBusinessHourTypes.DEFAULT,
				workHours: [
					{
						day: 'Sunday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Sunday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Sunday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Sunday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Sunday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Monday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Monday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Monday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Monday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Monday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Tuesday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Tuesday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Tuesday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Tuesday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Tuesday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Wednesday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Wednesday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Wednesday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Wednesday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Wednesday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Thursday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Thursday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Thursday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Thursday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Thursday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Friday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Friday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Friday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Friday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Friday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
					{
						day: 'Saturday',
						start: {
							time: '00:00',
							utc: {
								dayOfWeek: 'Saturday',
								time: '03:00',
							},
							cron: {
								dayOfWeek: 'Saturday',
								time: '00:00',
							},
						},
						finish: {
							time: '00:01',
							utc: {
								dayOfWeek: 'Saturday',
								time: '03:01',
							},
							cron: {
								dayOfWeek: 'Saturday',
								time: '00:01',
							},
						},
						open: true,
						code: '',
					},
				],
			},
		]);

		expect(bh.length).toEqual(0);
	});
});

describe('finish time boundary', () => {
	afterEach(() => jest.useRealTimers());

	// 00:00-23:59 in Asia/Kolkata, which on a UTC server runs from Saturday 18:30 to Sunday 18:29
	const alwaysOpenSunday = [
		{
			_id: '68516f256ebb4bdceda2757e',
			name: '',
			active: true,
			type: LivechatBusinessHourTypes.DEFAULT,
			ts: new Date(),
			workHours: [
				{
					day: 'Sunday',
					start: {
						time: '00:00',
						utc: { dayOfWeek: 'Saturday', time: '18:30' },
						cron: { dayOfWeek: 'Saturday', time: '18:30' },
					},
					finish: {
						time: '23:59',
						utc: { dayOfWeek: 'Sunday', time: '18:29' },
						cron: { dayOfWeek: 'Sunday', time: '18:29' },
					},
					open: true,
					code: '',
				},
			],
			timezone: {
				name: 'Asia/Kolkata',
				utc: '+05:30',
			},
		},
	];

	it('should keep the business hour open during its finish minute', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2025-07-27T18:29:30Z'));

		expect(await filterBusinessHoursThatMustBeOpened(alwaysOpenSunday)).toHaveLength(1);
	});

	it('should close the business hour once the finish minute has elapsed', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2025-07-27T18:30:30Z'));

		expect(await filterBusinessHoursThatMustBeOpened(alwaysOpenSunday)).toHaveLength(0);
	});

	it('should keep a same-day business hour open during its finish minute', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2025-07-28T20:00:30Z'));

		const bh = await filterBusinessHoursThatMustBeOpened([
			{
				_id: '68516f256ebb4bdceda2757f',
				active: true,
				type: LivechatBusinessHourTypes.DEFAULT,
				workHours: [
					{
						day: 'Monday',
						start: {
							time: '08:00',
							utc: { dayOfWeek: 'Monday', time: '08:00' },
							cron: { dayOfWeek: 'Monday', time: '08:00' },
						},
						finish: {
							time: '20:00',
							utc: { dayOfWeek: 'Monday', time: '20:00' },
							cron: { dayOfWeek: 'Monday', time: '20:00' },
						},
						open: true,
						code: '',
					},
				],
			},
		]);

		expect(bh).toHaveLength(1);
	});
});
