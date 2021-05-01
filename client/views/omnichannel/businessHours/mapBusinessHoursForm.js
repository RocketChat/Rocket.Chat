export const mapBusinessHoursForm = (formData, data) => {
	const { daysOpen, daysTime } = formData;

	return data.workHours?.map((day) => {
		const {
			day: currentDay,
			start: { time: start },
			finish: { time: finish },
		} = day;
		const open = daysOpen.includes(currentDay);
		if (daysTime[currentDay]) {
			const { start, finish } = daysTime[currentDay];
			return { day: currentDay, start, finish, open };
		}
		return { day: currentDay, start, finish, open };
	});
};
