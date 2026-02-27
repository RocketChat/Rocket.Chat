import type { IUser } from '@rocket.chat/core-typings';
import { Users, Analytics, Sessions } from '@rocket.chat/models';
import { subDays, subHours } from 'date-fns';

import { convertDateToInt, diffBetweenDaysInclusive, getTotalOfWeekItems, convertIntToDate } from './date';

export const handleUserCreated = async (user: IUser): Promise<IUser> => {
	if (user.roles?.includes('anonymous')) {
		return user;
	}

	await Analytics.saveUserData({
		date: convertDateToInt(user.createdAt),
	});

	return user;
};

export const fillFirstDaysOfUsersIfNeeded = async (date: Date): Promise<void> => {
	const usersFromAnalytics = await Analytics.findByTypeBeforeDate({
		type: 'users',
		date: convertDateToInt(date),
	}).toArray();
	if (!usersFromAnalytics.length) {
		const startOfPeriod = subDays(date, 90);
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
	const endOfLastWeek = subDays(start, 1);
	const startOfLastWeek = subDays(endOfLastWeek, daysBetweenDates);
	const today = convertDateToInt(end);
	const yesterday = convertDateToInt(subDays(end, 1));
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
	const yesterdayUsers = currentPeriodUsers.find((item) => item._id === yesterday)?.users || 0;
	const todayUsers = currentPeriodUsers.find((item) => item._id === today)?.users || 0;
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

const createDestructuredDate = (input: Date | number): { year: number; month: number; day: number } => {
	const date = new Date(input);
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
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
		start: subHours(start, 24),
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
		start: createDestructuredDate(subDays(start, 7)),
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
