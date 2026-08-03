import type { IUser } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { check, Match } from 'meteor/check';

import { usersExamples } from './users.examples';
import { API } from '../../../../server/api';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';
import {
	findWeeklyUsersRegisteredData,
	findActiveUsersMonthlyData,
	findBusiestsChatsInADayByHours,
	findBusiestsChatsWithinAWeek,
	findUserSessionsByHourWithinAWeek,
} from '../../lib/engagementDashboard/users';

const newUsersResponseSchema = ajv.compile<{
	days: { day: Date; users: number }[];
	period: { count: number; variation: number };
	yesterday: { count: number; variation: number };
}>({
	type: 'object',
	properties: {
		days: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					day: { type: 'string', format: 'date-time' },
					users: { type: 'number' },
				},
				required: ['day', 'users'],
				additionalProperties: false,
			},
		},
		period: {
			type: 'object',
			properties: {
				count: { type: 'number' },
				variation: { type: 'number' },
			},
			required: ['count', 'variation'],
			additionalProperties: false,
		},
		yesterday: {
			type: 'object',
			properties: {
				count: { type: 'number' },
				variation: { type: 'number' },
			},
			required: ['count', 'variation'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['days', 'period', 'yesterday', 'success'],
	additionalProperties: false,
});

const activeUsersResponseSchema = ajv.compile<{
	month: { day: number; month: number; year: number; usersList: IUser['_id'][]; users: number }[];
}>({
	type: 'object',
	properties: {
		month: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					day: { type: 'number' },
					month: { type: 'number' },
					year: { type: 'number' },
					usersList: { type: 'array', items: { type: 'string' } },
					users: { type: 'number' },
				},
				required: ['day', 'month', 'year', 'usersList', 'users'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['month', 'success'],
	additionalProperties: false,
});

const hourlyDataResponseSchema = ajv.compile<{ hours: { hour: number; users: number }[] }>({
	type: 'object',
	properties: {
		hours: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					hour: { type: 'number' },
					users: { type: 'number' },
				},
				required: ['hour', 'users'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['hours', 'success'],
	additionalProperties: false,
});

const weeklyChatBusierResponseSchema = ajv.compile<{
	month: { day: number; month: number; year: number; users: number }[];
}>({
	type: 'object',
	properties: {
		month: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					day: { type: 'number' },
					month: { type: 'number' },
					year: { type: 'number' },
					users: { type: 'number' },
				},
				required: ['day', 'month', 'year', 'users'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['month', 'success'],
	additionalProperties: false,
});

const userSessionsByHourResponseSchema = ajv.compile<{
	week: { hour: number; day: number; month: number; year: number; users: number }[];
}>({
	type: 'object',
	properties: {
		week: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					hour: { type: 'number' },
					day: { type: 'number' },
					month: { type: 'number' },
					year: { type: 'number' },
					users: { type: 'number' },
				},
				required: ['hour', 'day', 'month', 'year', 'users'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['week', 'success'],
	additionalProperties: false,
});

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

API.v1.get(
	'engagement-dashboard/users/new-users',
	{
		summary: 'Get New Users',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Retrieve the metrics of newly registered users during a specific period.

Permission required: \`view-engagement-dashboard\`

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|3.1.0            | Added       |`,
		examples: usersExamples['engagement-dashboard/users/new-users'],
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: newUsersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'engagement-dashboard/users/active-users',
	{
		summary: 'Get Active Users',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Retrieve the metrics of active users in the workspace during a specific period.

Permission required: \`view-engagement-dashboard\` 

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|3.1.0            | Added       |`,
		examples: usersExamples['engagement-dashboard/users/active-users'],
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: activeUsersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'engagement-dashboard/users/chat-busier/hourly-data',
	{
		summary: 'Get Hourly Data When Chat is Busier',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Retrieve hourly data when chat is busier.

Permission required: \`view-engagement-dashboard\` 

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|3.1.0            | Added       |`,
		examples: usersExamples['engagement-dashboard/users/chat-busier/hourly-data'],
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: hourlyDataResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'engagement-dashboard/users/chat-busier/weekly-data',
	{
		summary: 'Get Weekly Data When Chat is Busier',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Retrieves weekly data when chat is busier. 

Permission required: \`view-engagement-dashboard\` 

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|3.1.0            | Added       |`,
		examples: usersExamples['engagement-dashboard/users/chat-busier/weekly-data'],
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: weeklyChatBusierResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'engagement-dashboard/users/users-by-time-of-the-day-in-a-week',
	{
		summary: 'Get User By Time of the Day',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Retrieve users by hours at a particular time of the day in a week.

Permission required: \`view-engagement-dashboard\`  

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|3.1.0            | Added       |`,
		examples: usersExamples['engagement-dashboard/users/users-by-time-of-the-day-in-a-week'],
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: userSessionsByHourResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);
