import moment from 'moment';

export type DateRange = {
	start?: Date;
	end?: Date;
};

export const createStartOfToday = () => moment().startOf('day').toDate();
export const createEndOfToday = () => moment().endOf('day').toDate();
