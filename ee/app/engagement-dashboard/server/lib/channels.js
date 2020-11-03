import { cloneDate, subtractDate, getNativeDate, getDate } from '../../../../../lib/rocketchat-dates';
import { Rooms } from '../../../../../app/models/server/raw';
import { convertDateToInt, diffBetweenDaysInclusive } from './date';

export const findAllChannelsWithNumberOfMessages = async ({ start, end, options = {} }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = getNativeDate(subtractDate(cloneDate(getDate(start)), 1, 'days'));
	const startOfLastWeek = getNativeDate(subtractDate(cloneDate(getDate(endOfLastWeek)), daysBetweenDates, 'days'));
	const total = await Rooms.findChannelsWithNumberOfMessagesBetweenDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		startOfLastWeek: convertDateToInt(startOfLastWeek),
		endOfLastWeek: convertDateToInt(endOfLastWeek),
		onlyCount: true,
	}).toArray();
	return {
		channels: await Rooms.findChannelsWithNumberOfMessagesBetweenDate({
			start: convertDateToInt(start),
			end: convertDateToInt(end),
			startOfLastWeek: convertDateToInt(startOfLastWeek),
			endOfLastWeek: convertDateToInt(endOfLastWeek),
			options,
		}),
		total: total.length ? total[0].total : 0,
	};
};
