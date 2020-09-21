import moment from 'moment';

export const getDateRange = () => {
	const today = moment(new Date());
	return {
		start: `${ moment(new Date(today.year(), today.month(), today.date(), 0, 0, 0)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`,
		end: `${ moment(new Date(today.year(), today.month(), today.date(), 23, 59, 59)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`,
	};
};
