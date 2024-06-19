export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const closedDays = ['Saturday', 'Sunday'];

export const defaultWorkHours = (allDays = false) =>
	DAYS_OF_WEEK.map((day) => ({
		day,
		start: {
			time: '08:00',
		},
		finish: {
			time: '11:00',
		},
		open: allDays ? true : !closedDays.includes(day),
	}));
