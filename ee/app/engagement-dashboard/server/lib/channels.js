import moment from 'moment';

import { Rooms } from '../../../../../app/models/server/raw';
import { convertDateToInt, diffBetweenDaysInclusive } from './date';

export const findAllChannelsWithNumberOfMessages = async ({ start, end, options = {} }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).clone().subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(daysBetweenDates, 'days').toDate();
	return {
		channels: await Rooms.findChannelsWithNumberOfMessagesBetweenDate({
			start: convertDateToInt(start),
			end: convertDateToInt(end),
			startOfLastWeek: convertDateToInt(startOfLastWeek),
			endOfLastWeek: convertDateToInt(endOfLastWeek),
			options,
		}),
	};
};
