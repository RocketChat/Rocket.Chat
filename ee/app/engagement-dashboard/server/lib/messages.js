import { getNativeDate, subtractDate, cloneDate, getDate } from '../../../../../lib/rocketchat-dates';
import AnalyticsRaw from '../../../../../app/models/server/raw/Analytics';
import { roomTypes } from '../../../../../app/utils';
import { Messages } from '../../../../../app/models/server/raw';
import { Analytics } from '../../../../../app/models/server';
import { convertDateToInt, diffBetweenDaysInclusive, convertIntToDate, getTotalOfWeekItems } from './date';

export const handleMessagesSent = (message, room) => {
	const roomTypesToShow = roomTypes.getTypesToShowOnDashboard();
	if (!roomTypesToShow.includes(room.t)) {
		return message;
	}
	Promise.await(AnalyticsRaw.saveMessageSent({
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
	Promise.await(AnalyticsRaw.saveMessageDeleted({
		date: convertDateToInt(message.ts),
		room,
	}));
	return message;
};

export const fillFirstDaysOfMessagesIfNeeded = async (date) => {
	const messagesFromAnalytics = await AnalyticsRaw.findByTypeBeforeDate({
		type: 'messages',
		date: convertDateToInt(date),
	}).toArray();
	if (!messagesFromAnalytics.length) {
		const startOfPeriod = getNativeDate(subtractDate(getDate(convertIntToDate(date)), 90, 'days'));
		const messages = await Messages.getTotalOfMessagesSentByDate({
			start: startOfPeriod,
			end: date,
		});
		messages.forEach((message) => Analytics.insert(message));
	}
};

export const findWeeklyMessagesSentData = async ({ start, end }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = getNativeDate(subtractDate(cloneDate(getDate(start)), 1, 'days'));
	const startOfLastWeek = getNativeDate(subtractDate(cloneDate(getDate(endOfLastWeek)), daysBetweenDates, 'days'));
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(getNativeDate(subtractDate(cloneDate(getDate(end)), 1, 'days')));
	const currentPeriodMessages = await AnalyticsRaw.getMessagesSentTotalByDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const lastPeriodMessages = await AnalyticsRaw.getMessagesSentTotalByDate({
		start: convertDateToInt(startOfLastWeek),
		end: convertDateToInt(endOfLastWeek),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const yesterdayMessages = (currentPeriodMessages.find((item) => item._id === yesterday) || {}).messages || 0;
	const todayMessages = (currentPeriodMessages.find((item) => item._id === today) || {}).messages || 0;
	const currentPeriodTotalOfMessages = getTotalOfWeekItems(currentPeriodMessages, 'messages');
	const lastPeriodTotalOfMessages = getTotalOfWeekItems(lastPeriodMessages, 'messages');
	return {
		days: currentPeriodMessages.map((day) => ({ day: convertIntToDate(day._id), messages: day.messages })),
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

export const findMessagesSentOrigin = async ({ start, end }) => {
	const origins = await AnalyticsRaw.getMessagesOrigin({
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
	const channels = await AnalyticsRaw.getMostPopularChannelsByMessagesSentQuantity({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: 5, sort: { messages: -1 } },
	});
	return { channels };
};
