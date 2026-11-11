import { endOfDay } from 'date-fns/endOfDay';
import { startOfDay } from 'date-fns/startOfDay';

export type DateRange = {
	start?: Date;
	end?: Date;
};

export const createStartOfToday = () => startOfDay(new Date());
export const createEndOfToday = () => endOfDay(new Date());
