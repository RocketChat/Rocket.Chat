import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import { Analytics, Rooms } from '@rocket.chat/models';
import moment from 'moment';

import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { convertDateToInt, diffBetweenDaysInclusive } from './date';

export const findChannelsWithNumberOfMessages = async ({
	start,
	end,
	hideRoomsWithNoActivity,
	options = {},
}: {
	start: Date;
	end: Date;
	hideRoomsWithNoActivity: boolean;
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
	if (!hideRoomsWithNoActivity) {
		return findAllChannelsWithNumberOfMessages({ start, end, options });
	}

	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).subtract(daysBetweenDates, 'days').toDate();
	const roomTypes = roomCoordinator.getTypesToShowOnDashboard() as Array<IRoom['t']>;

	const aggregationResult = await Analytics.findRoomsByTypesWithNumberOfMessagesBetweenDate({
		types: roomTypes,
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		startOfLastWeek: convertDateToInt(startOfLastWeek),
		endOfLastWeek: convertDateToInt(endOfLastWeek),
		options,
	}).toArray();

	// The aggregation result may be undefined if there are no matching analytics or corresponding rooms in the period
	if (!aggregationResult.length) {
		return { channels: [], total: 0 };
	}

	const [{ channels, total }] = aggregationResult;
	return {
		channels,
		total,
	};
};

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
	const roomTypes = roomCoordinator.getTypesToShowOnDashboard() as Array<IRoom['t']>;

	const channels = await Rooms.findChannelsByTypesWithNumberOfMessagesBetweenDate({
		types: roomTypes,
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		startOfLastWeek: convertDateToInt(startOfLastWeek),
		endOfLastWeek: convertDateToInt(endOfLastWeek),
		options,
	}).toArray();

	const total = await Rooms.countDocuments({ t: { $in: roomTypes } });

	return {
		channels,
		total,
	};
};
