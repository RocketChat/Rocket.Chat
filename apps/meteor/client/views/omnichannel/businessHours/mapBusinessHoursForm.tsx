import type { dataType, DaysTime } from './BusinessHoursFormContainer';

export const mapBusinessHoursForm = (formData: { daysOpen: string[]; daysTime: DaysTime }, data: dataType) => {
	const { daysOpen, daysTime } = formData;

	return data.workHours?.map((day) => {
		const {
			day: currentDay,
			start: { time: start },
			finish: { time: finish },
		} = day;
		const open = daysOpen.includes(currentDay);
		if (daysTime[currentDay as keyof typeof daysTime]) {
			const { start, finish } = daysTime[currentDay as keyof typeof daysTime];
			return { day: currentDay, start, finish, open };
		}
		return { day: currentDay, start, finish, open };
	});
};
