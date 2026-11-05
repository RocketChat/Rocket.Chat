import { getSchedulePresets } from './schedulePresets';

describe('getSchedulePresets', () => {
	it('offers 9:00 tomorrow and 9:00 next Monday in local time', () => {
		const { tomorrow, nextMonday } = getSchedulePresets(new Date(2026, 9, 21, 15, 30));

		expect(tomorrow).toEqual(new Date(2026, 9, 22, 9, 0));
		expect(nextMonday).toEqual(new Date(2026, 9, 26, 9, 0));
	});

	it('offers the Monday of next week when today is Monday', () => {
		expect(getSchedulePresets(new Date(2026, 9, 26, 8, 0)).nextMonday).toEqual(new Date(2026, 10, 2, 9, 0));
	});
});
