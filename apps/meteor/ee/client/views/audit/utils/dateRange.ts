import moment from 'moment';

export type DateRange = {
	start?: Date;
	end?: Date;
};

export const createTodayStart = () => moment().startOf('day').toDate();
export const createTodayEnd = () => moment().endOf('day').toDate();
