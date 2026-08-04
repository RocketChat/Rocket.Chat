import { startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
	start?: Date;
	end?: Date;
};

export const createStartOfToday = () => startOfDay(new Date());
export const createEndOfToday = () => endOfDay(new Date());
