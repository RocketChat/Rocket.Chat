import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import moment from 'moment';

import { convertDateToInt, diffBetweenDaysInclusive } from './date';

export const findAllChannelsWithNumberOfMessages = async ({
	start,
	end,
	options = {},
}: {
	start: Date;
	end: Date;
	options: {
		offset?: number;
		count?: number;
	};
}): Promise<{
	channels: {
		room: {
			_id: IRoom['_id'];
			name: IRoom['name'] | IRoom['fname'];
			ts: IRoom['ts'];
			t: IRoom['t'];
			_updatedAt: IRoom['_updatedAt'];
			usernames?: IDirectMessageRoom['usernames'];
		};
		messages: number;
		lastWeekMessages: number;
		diffFromLastWeek: number;
	}[];
	total: number;
}> => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).subtract(daysBetweenDates, 'days').toDate();

	const channels = await Rooms.findChannelsWithNumberOfMessagesBetweenDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		startOfLastWeek: convertDateToInt(startOfLastWeek),
		endOfLastWeek: convertDateToInt(endOfLastWeek),
		options,
	}).toArray();

	const total =
		(
			await Rooms.countChannelsWithNumberOfMessagesBetweenDate({
				start: convertDateToInt(start),
				end: convertDateToInt(end),
				startOfLastWeek: convertDateToInt(startOfLastWeek),
				endOfLastWeek: convertDateToInt(endOfLastWeek),
			}).toArray()
		)[0]?.total ?? 0;

	return {
		channels,
		total,
	};
};
