import moment from 'moment';
import type { IUser } from '@rocket.chat/core-typings';

import { Users, Analytics, Sessions } from '../../../../app/models/server/raw';
import { convertDateToInt, diffBetweenDaysInclusive, getTotalOfWeekItems, convertIntToDate } from './date';

export const handleUserCreated = (user: IUser): IUser => {
	if (user.roles?.includes('anonymous')) {
		return user;
	}

	Promise.await(
		Analytics.saveUserData({
			date: convertDateToInt(user.createdAt),
		}),
	);

	return user;
};

export const fillFirstDaysOfUsersIfNeeded = async (date: Date): Promise<void> => {
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
		users.forEach((user) =>
			Analytics.insertOne({
				...user,
				date: parseInt(user.date),
			}),
		);
	}
};

export const findWeeklyUsersRegisteredData = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	days: { day: Date; users: number }[];
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

const createDestructuredDate = (
	input: moment.MomentInput,
): {
	year: number;
	month: number;
	day: number;
} => {
	const date = moment(input);

	return {
		year: date.year(),
		month: date.month() + 1,
		day: date.date(),
	};
};

export const findActiveUsersMonthlyData = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	month: {
		day: number;
		month: number;
		year: number;
		usersList: IUser['_id'][];
		users: number;
	}[];
}> => ({
	month: await Sessions.getActiveUsersOfPeriodByDayBetweenDates({
		start: createDestructuredDate(start),
		end: createDestructuredDate(end),
	}),
});

export const findBusiestsChatsInADayByHours = async ({
	start,
}: {
	start: Date;
}): Promise<{
	hours: {
		hour: number;
		users: number;
	}[];
}> => ({
	hours: await Sessions.getBusiestTimeWithinHoursPeriod({
		start: moment(start).subtract(24, 'hours').toDate(),
		end: start,
		groupSize: 2,
	}),
});

export const findBusiestsChatsWithinAWeek = async ({
	start,
}: {
	start: Date;
}): Promise<{
	month: {
		day: number;
		month: number;
		year: number;
		users: number;
	}[];
}> => ({
	month: await Sessions.getTotalOfSessionsByDayBetweenDates({
		start: createDestructuredDate(moment(start).subtract(7, 'days')),
		end: createDestructuredDate(start),
	}),
});

export const findUserSessionsByHourWithinAWeek = async ({
	start,
	end,
}: {
	start: Date;
	end: Date;
}): Promise<{
	week: {
		hour: number;
		day: number;
		month: number;
		year: number;
		users: number;
	}[];
}> => ({
	week: await Sessions.getTotalOfSessionByHourAndDayBetweenDates({
		start,
		end,
	}),
});
