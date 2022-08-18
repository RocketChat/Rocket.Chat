import moment from 'moment';
import type { IDirectMessageRoom, IRoom, IMessage } from '@rocket.chat/core-typings';
import { Messages, Analytics } from '@rocket.chat/models';

import { convertDateToInt, diffBetweenDaysInclusive, convertIntToDate, getTotalOfWeekItems } from './date';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

export const handleMessagesSent = (message: IMessage, room?: IRoom): IMessage => {
	const roomTypesToShow = roomCoordinator.getTypesToShowOnDashboard();
	if (!room || !roomTypesToShow.includes(room.t)) {
		return message;
	}

	Promise.await(
		Analytics.saveMessageSent({
			date: convertDateToInt(message.ts),
			room,
		}),
	);
	return message;
};

export const handleMessagesDeleted = (message: IMessage, room?: IRoom): IMessage => {
	const roomTypesToShow = roomCoordinator.getTypesToShowOnDashboard();
	if (!room || !roomTypesToShow.includes(room.t)) {
		return message;
	}

	Promise.await(
		Analytics.saveMessageDeleted({
			date: convertDateToInt(message.ts),
			room,
		}),
	);
	return message;
};

export const fillFirstDaysOfMessagesIfNeeded = async (date: Date): Promise<void> => {
	const messagesFromAnalytics = await Analytics.findByTypeBeforeDate({
		type: 'messages',
		date: convertDateToInt(date),
	}).toArray();
	if (!messagesFromAnalytics.length) {
		const startOfPeriod = moment(date).subtract(90, 'days').toDate();
		const messages = await Messages.getTotalOfMessagesSentByDate({
			start: startOfPeriod,
			end: date,
		});
		await Promise.all(
			messages.map((message) =>
				Analytics.insertOne({
					...message,
					date: parseInt(message.date),
				}),
			),
		);
	}
};

export const findWeeklyMessagesSentData = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	days: { day: Date; messages: number }[];
	period: {
		count: number;
		variation: number;
	};
	yesterday: {
		count: number;
		variation: number;
	};
}> => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).clone().subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(daysBetweenDates, 'days').toDate();
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(moment(end).clone().subtract(1, 'days').toDate());
	const currentPeriodMessages = await Analytics.getMessagesSentTotalByDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	}).toArray();
	const lastPeriodMessages = await Analytics.getMessagesSentTotalByDate({
		start: convertDateToInt(startOfLastWeek),
		end: convertDateToInt(endOfLastWeek),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	}).toArray();
	const yesterdayMessages = currentPeriodMessages.find((item) => item._id === yesterday)?.messages || 0;
	const todayMessages = currentPeriodMessages.find((item) => item._id === today)?.messages || 0;
	const currentPeriodTotalOfMessages = getTotalOfWeekItems(currentPeriodMessages, 'messages');
	const lastPeriodTotalOfMessages = getTotalOfWeekItems(lastPeriodMessages, 'messages');
	return {
		days: currentPeriodMessages.map((day) => ({
			day: convertIntToDate(day._id),
			messages: day.messages,
		})),
		period: {
			count: currentPeriodTotalOfMessages,
			variation: currentPeriodTotalOfMessages - lastPeriodTotalOfMessages,
		},
		yesterday: {
			count: yesterdayMessages,
			variation: todayMessages - yesterdayMessages,
		},
	};
};

export const findMessagesSentOrigin = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	origins: {
		t: IRoom['t'];
		messages: number;
	}[];
}> => {
	const origins = await Analytics.getMessagesOrigin({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
	}).toArray();
	const roomTypesToShow: IRoom['t'][] = roomCoordinator.getTypesToShowOnDashboard() as IRoom['t'][];
	const responseTypes = origins.map((origin) => origin.t);
	const missingTypes = roomTypesToShow.filter((type): type is IRoom['t'] => !responseTypes.includes(type));
	if (missingTypes.length) {
		missingTypes.forEach((type) => origins.push({ messages: 0, t: type }));
	}

	return { origins };
};

export const findTopFivePopularChannelsByMessageSentQuantity = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	channels: {
		t: IRoom['t'];
		messages: number;
		name: IRoom['name'] | IRoom['fname'];
		usernames?: IDirectMessageRoom['usernames'];
	}[];
}> => {
	const channels = await Analytics.getMostPopularChannelsByMessagesSentQuantity({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: 5, sort: { messages: -1 } },
	}).toArray();
	return { channels };
};
