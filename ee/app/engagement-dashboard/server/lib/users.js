import moment from 'moment';

import { Users, Analytics, Sessions } from '../../../../../app/models/server/raw';
import { convertDateToInt, diffBetweenDaysInclusive, getTotalOfWeekItems, convertIntToDate } from './date';

export const handleUserCreated = (user) => {
	if (user.roles?.includes('anonymous')) {
		return;
	}

	Promise.await(Analytics.saveUserData({
		date: convertDateToInt(user.ts),
		user,
	}));
	return user;
};

export const fillFirstDaysOfUsersIfNeeded = async (date) => {
	const usersFromAnalytics = await Analytics.findByTypeBeforeDate({
		type: 'users',
		date: convertDateToInt(date),
	}).toArray();
	if (!usersFromAnalytics.length) {
		const startOfPeriod = moment(date).subtract(90, 'days').toDate();
		const users = await Users.getTotalOfRegisteredUsersByDate({
			start: startOfPeriod,
			end: date,
		});
		users.forEach((user) => Analytics.insertOne({
			...user,
			date: parseInt(user.date),
		}));
	}
};

export const findWeeklyUsersRegisteredData = async ({ start, end }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).clone().subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(daysBetweenDates, 'days').toDate();
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(moment(end).clone().subtract(1, 'days').toDate());
	const currentPeriodUsers = await Analytics.getTotalOfRegisteredUsersByDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	}).toArray();
	const lastPeriodUsers = await Analytics.getTotalOfRegisteredUsersByDate({
		start: convertDateToInt(startOfLastWeek),
		end: convertDateToInt(endOfLastWeek),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	}).toArray();
	const yesterdayUsers = (currentPeriodUsers.find((item) => item._id === yesterday) || {}).users || 0;
	const todayUsers = (currentPeriodUsers.find((item) => item._id === today) || {}).users || 0;
	const currentPeriodTotalUsers = getTotalOfWeekItems(currentPeriodUsers, 'users');
	const lastPeriodTotalUsers = getTotalOfWeekItems(lastPeriodUsers, 'users');
	return {
		days: currentPeriodUsers.map((day) => ({ day: convertIntToDate(day._id), users: day.users })),
		period: {
			count: currentPeriodTotalUsers,
			variation: currentPeriodTotalUsers - lastPeriodTotalUsers,
		},
		yesterday: {
			count: yesterdayUsers,
			variation: todayUsers - yesterdayUsers,
		},
	};
};

export const findActiveUsersMonthlyData = async ({ start, end }) => {
	const startOfPeriod = moment(start);
	const endOfPeriod = moment(end);

	return {
		month: await Sessions.getActiveUsersOfPeriodByDayBetweenDates({
			start: {
				year: startOfPeriod.year(),
				month: startOfPeriod.month() + 1,
				day: startOfPeriod.date(),
			},
			end: {
				year: endOfPeriod.year(),
				month: endOfPeriod.month() + 1,
				day: endOfPeriod.date(),
			},
		}),
	};
};

export const findBusiestsChatsInADayByHours = async ({ start }) => {
	const now = moment(start);
	const yesterday = moment(now).clone().subtract(24, 'hours');
	return {
		hours: await Sessions.getBusiestTimeWithinHoursPeriod({
			start: yesterday.toDate(),
			end: now.toDate(),
			groupSize: 2,
		}),
	};
};

export const findBusiestsChatsWithinAWeek = async ({ start }) => {
	const today = moment(start);
	const startOfCurrentWeek = moment(today).clone().subtract(7, 'days');

	return {
		month: await Sessions.getTotalOfSessionsByDayBetweenDates({
			start: {
				year: startOfCurrentWeek.year(),
				month: startOfCurrentWeek.month() + 1,
				day: startOfCurrentWeek.date(),
			},
			end: {
				year: today.year(),
				month: today.month() + 1,
				day: today.date(),
			},
		}),
	};
};

export const findUserSessionsByHourWithinAWeek = async ({ start, end }) => {
	const startOfPeriod = moment(start);
	const endOfPeriod = moment(end);

	return {
		week: await Sessions.getTotalOfSessionByHourAndDayBetweenDates({
			start: startOfPeriod.toDate(),
			end: endOfPeriod.toDate(),
		}),
	};
};
