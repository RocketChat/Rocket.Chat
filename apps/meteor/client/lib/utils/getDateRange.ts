import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';

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
