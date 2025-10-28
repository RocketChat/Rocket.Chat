import type { IUser } from '@rocket.chat/core-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';
import {
	findWeeklyUsersRegisteredData,
	findActiveUsersMonthlyData,
	findBusiestsChatsInADayByHours,
	findBusiestsChatsWithinAWeek,
	findUserSessionsByHourWithinAWeek,
} from '../../lib/engagementDashboard/users';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/users/active-users': {
			GET: (params: { start: string; end: string }) => {
				month: {
					day: number;
					month: number;
					year: number;
					usersList: IUser['_id'][];
					users: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/chat-busier/weekly-data': {
			GET: (params: { start: string }) => {
				month: {
					users: number;
					day: number;
					month: number;
					year: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/chat-busier/hourly-data': {
			GET: (params: { start: string }) => {
				hours: {
					users: number;
					hour: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/users-by-time-of-the-day-in-a-week': {
			GET: (params: { start: string; end: string }) => {
				week: {
					users: number;
					hour: number;
					day: number;
					month: number;
					year: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/users/new-users': {
			GET: (params: { start: string; end: string }) => {
				days: { day: Date; users: number }[];
				period: {
					count: number;
					variation: number;
				};
				yesterday: {
					count: number;
					variation: number;
				};
			};
		};
	}
}

API.v1.addRoute(
	'engagement-dashboard/users/new-users',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findWeeklyUsersRegisteredData(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/users/active-users',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findActiveUsersMonthlyData(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/users/chat-busier/hourly-data',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
				}),
			);

			const { start } = this.queryParams;

			const data = await findBusiestsChatsInADayByHours(transformDatesForAPI(start));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/users/chat-busier/weekly-data',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
				}),
			);

			const { start } = this.queryParams;

			const data = await findBusiestsChatsWithinAWeek(transformDatesForAPI(start));
			return API.v1.success(data);
		},
	},
);

API.v1.addRoute(
	'engagement-dashboard/users/users-by-time-of-the-day-in-a-week',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
	},
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					start: Match.Where(isDateISOString),
					end: Match.Where(isDateISOString),
				}),
			);

			const { start, end } = this.queryParams;

			const data = await findUserSessionsByHourWithinAWeek(transformDatesForAPI(start, end));
			return API.v1.success(data);
		},
	},
);
