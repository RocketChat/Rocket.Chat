import { startOfDay, endOfDay } from 'date-fns';

export const getDateRange = (): {
	start: string;
	end: string;
} => {
	const now = new Date();
	return {
		start: startOfDay(now).toISOString(),
		end: endOfDay(now).toISOString(),
	};
};
