import moment from 'moment';

import Analytics from '../../../../../app/models/server/raw/Analytics';
import Sessions from '../../../../../app/models/server/raw/Sessions';
import { convertDateToInt, diffBetweenDaysInclusive, fillDateArrayWithEmptyDaysIfNeeded, getTotalOfWeekItems, convertIntToDate } from './date';

export const handleUserCreated = (user) => {
	Promise.await(Analytics.saveUserData({
		date: convertDateToInt(user.ts),
		user,
	}));
	return user;
};

export const findWeeklyUsersRegisteredData = async ({ start, end }) => {
	const daysBetweenDates = diffBetweenDaysInclusive(end, start);
	const endOfLastWeek = moment(start).clone().subtract(1, 'days').toDate();
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(daysBetweenDates, 'days').toDate();
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(moment(end).clone().subtract(1, 'days').toDate());
	const users = await Analytics.getTotalOfRegisteredUsersByDate({
		start: convertDateToInt(start),
		end: convertDateToInt(end),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const lastWeekUsers = await Analytics.getTotalOfRegisteredUsersByDate({
		start: convertDateToInt(startOfLastWeek),
		end: convertDateToInt(endOfLastWeek),
		options: { count: daysBetweenDates, sort: { _id: -1 } },
	});
	const currentWeekUsersData = fillDateArrayWithEmptyDaysIfNeeded(users, daysBetweenDates, end, 'users');
	const yesterdayUsers = (currentWeekUsersData.find((item) => item._id === yesterday) || {}).users || 0;
	const todayUsers = (currentWeekUsersData.find((item) => item._id === today) || {}).users || 0;
	const currentWeekTotalOfUsers = getTotalOfWeekItems(users, 'users');
	const lastWeekTotalOfUsers = getTotalOfWeekItems(lastWeekUsers, 'users');
	return {
		days: currentWeekUsersData.map((day) => ({ day: convertIntToDate(day._id), users: day.users })),
		week: {
			users: currentWeekTotalOfUsers,
			diffFromLastWeek: currentWeekTotalOfUsers - lastWeekTotalOfUsers,
		},
		yesterday: {
			users: yesterdayUsers,
			diffFromToday: todayUsers - yesterdayUsers,
		},
	};
};

export const findActiveUsersOverviewData = async ({ start }) => {
	const today = moment(start);
	const yesterday = today.clone().subtract(1, 'days');
	const startOfCurrentWeek = moment(yesterday).clone().subtract(7, 'days');
	const endOfLastWeek = moment(startOfCurrentWeek).clone().subtract(1, 'days');
	const startOfLastWeek = moment(endOfLastWeek).clone().subtract(7, 'days');
	const startOfCurrentMonth = moment(yesterday).clone().subtract(30, 'days');

	const currentUsers = (await Sessions.getActiveUsersBetweenDates({
		start: {
			year: today.year(),
			month: today.month() + 1,
			day: today.date(),
		},
		end: {
			year: today.year(),
			month: today.month() + 1,
			day: today.date(),
		},
	})).length;
	const yesterdayUsers = (await Sessions.getActiveUsersBetweenDates({
		start: {
			year: yesterday.year(),
			month: yesterday.month() + 1,
			day: yesterday.date(),
		},
		end: {
			year: yesterday.year(),
			month: yesterday.month() + 1,
			day: yesterday.date(),
		},
	})).length;
	const currentWeekUsers = (await Sessions.getActiveUsersBetweenDates({
		start: {
			year: startOfCurrentWeek.year(),
			month: startOfCurrentWeek.month() + 1,
			day: startOfCurrentWeek.date(),
		},
		end: {
			year: yesterday.year(),
			month: yesterday.month() + 1,
			day: yesterday.date(),
		},
	})).length;
	const lastWeekUsers = (await Sessions.getActiveUsersBetweenDates({
		start: {
			year: startOfLastWeek.year(),
			month: startOfLastWeek.month() + 1,
			day: startOfLastWeek.date(),
		},
		end: {
			year: endOfLastWeek.year(),
			month: endOfLastWeek.month() + 1,
			day: endOfLastWeek.date(),
		},
	})).length;
	const currentMonthUsers = (await Sessions.getActiveUsersBetweenDates({
		start: {
			year: startOfCurrentMonth.year(),
			month: startOfCurrentMonth.month() + 1,
			day: startOfCurrentMonth.date(),
		},
		end: {
			year: yesterday.year(),
			month: yesterday.month() + 1,
			day: yesterday.date(),
		},
	})).length;

	return {
		daily: {
			current: currentUsers,
			diffFromYesterday: currentUsers - yesterdayUsers,
		},
		week: {
			current: currentWeekUsers,
			diffFromLastWeek: currentWeekUsers - lastWeekUsers,
		},
		month: {
			current: currentMonthUsers,
		},
	};
};

export const findActiveUsersMonthlyData = async ({ start }) => {
	const today = moment(start);
	const startOfCurrentMonth = moment(today).clone().subtract(30, 'days');

	return {
		month: await Sessions.getActiveUsersOfPeriodByDayBetweenDates({
			start: {
				year: startOfCurrentMonth.year(),
				month: startOfCurrentMonth.month() + 1,
				day: startOfCurrentMonth.date(),
			},
			end: {
				year: today.year(),
				month: today.month() + 1,
				day: today.date(),
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

export const findUserSessionsByHourWithinAWeek = async ({ start }) => {
	const today = moment(start);
	const startOfCurrentWeek = moment(today).clone().subtract(7, 'days');

	return {
		week: await Sessions.getTotalOfSessionByHourAndDayBetweenDates({
			start: startOfCurrentWeek.toDate(),
			end: today.toDate(),
		}),
	};
};
