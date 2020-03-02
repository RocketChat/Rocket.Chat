import moment from 'moment';

import Analytics from '../../../../../app/models/server/raw/Analytics';
import { roomTypes } from '../../../../../app/utils';
import { convertDateToInt, diffBetweenDaysInclusive, convertIntToDate, fillDateArrayWithEmptyDaysIfNeeded, getTotalOfWeekItems } from './date';

export const handleMessagesSent = (message, room) => {
	const roomTypesToShow = roomTypes.getTypesToShowOnDashboard();
	if (!roomTypesToShow.includes(room.t)) {
		return;
	}
	Promise.await(Analytics.saveMessageSent({
		date: convertDateToInt(message.ts),
		room,
	}));
	return message;
};

export const handleMessagesDeleted = (message, room) => {
	const roomTypesToShow = roomTypes.getTypesToShowOnDashboard();
	if (!roomTypesToShow.includes(room.t)) {
		return;
	}
	Promise.await(Analytics.saveMessageDeleted({
		date: convertDateToInt(message.ts),
		room,
	}));
	return message;
};

export const findWeeklyMessagesSentData = async ({ start, end }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).clone().subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(daysBetweenDates, 'days').toDate();
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(moment(end).clone().subtract(1, 'days').toDate());
	const messages = await Analytics.getMessagesSentTotalByDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const lastWeekMessages = await Analytics.getMessagesSentTotalByDate({
		start: convertDateToInt(startOfLastWeek),
		end: convertDateToInt(endOfLastWeek),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const currentWeekData = fillDateArrayWithEmptyDaysIfNeeded(messages, daysBetweenDates, end, 'messages');
	const yesterdayMessages = (currentWeekData.find((item) => item._id === yesterday) || {}).messages || 0;
	const todayMessages = (currentWeekData.find((item) => item._id === today) || {}).messages || 0;
	const currentWeekTotalOfMessages = getTotalOfWeekItems(messages, 'messages');
	const lastWeekTotalOfMessages = getTotalOfWeekItems(lastWeekMessages, 'messages');
	return {
		days: currentWeekData.map((day) => ({ day: convertIntToDate(day._id), messages: day.messages })),
		week: {
			messages: currentWeekTotalOfMessages,
			diffFromLastWeek: currentWeekTotalOfMessages - lastWeekTotalOfMessages,
		},
		yesterday: {
			messages: yesterdayMessages,
			diffFromToday: todayMessages - yesterdayMessages,
		},
	};
};

export const findMessagesSentOrigin = async ({ start, end }) => {
	const origins = await Analytics.getMessagesOrigin({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
	});
	const roomTypesToShow = roomTypes.getTypesToShowOnDashboard();
	const responseTypes = origins.map((origin) => origin.t);
	const missingTypes = roomTypesToShow.filter((type) => !responseTypes.includes(type));
	if (missingTypes.length) {
		missingTypes.forEach((type) => origins.push({ messages: 0, t: type }));
	}
	return { origins };
};

export const findTopFivePopularChannelsByMessageSentQuantity = async ({ start, end }) => {
	const channels = await Analytics.getMostPopularChannelsByMessagesSentQuantity({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: 5, sort: { messages: -1 } },
	});
	return { channels };
};
