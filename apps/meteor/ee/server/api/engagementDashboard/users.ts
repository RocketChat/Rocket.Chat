import type { IUser } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { check, Match } from 'meteor/check';

import { API } from '../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../app/api/server/ApiClass';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';
import {
	findWeeklyUsersRegisteredData,
	findActiveUsersMonthlyData,
	findBusiestsChatsInADayByHours,
	findBusiestsChatsWithinAWeek,
	findUserSessionsByHourWithinAWeek,
} from '../../lib/engagementDashboard/users';

const newUsersEndpoints = API.v1.get(
	'engagement-dashboard/users/new-users',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		query: ajv.compile<{
			start: string;
			end: string;
		}>({
			type: 'object',
			properties: {
				start: {
					type: 'string',
					format: 'date-time',
					description: 'Start date',
				},
				end: {
					type: 'string',
					format: 'date-time',
					description: 'End date',
				},
			},
			required: ['start', 'end'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				days: { day: Date; users: number }[];
				period: {
					count: number;
					variation: number;
				};
				yesterday: {
					count: number;
					variation: number;
				};
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
				required: ['month', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

const activeUsersEndpoints = API.v1.get(
	'engagement-dashboard/users/active-users',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		query: ajv.compile<{
			start: string;
			end: string;
		}>({
			type: 'object',
			properties: {
				start: {
					type: 'string',
					format: 'date-time',
					description: 'Start date',
				},
				end: {
					type: 'string',
					format: 'date-time',
					description: 'End date',
				},
			},
			required: ['start', 'end'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				month: {
					day: number;
					month: number;
					year: number;
					usersList: IUser['_id'][];
					users: number;
				}[];
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
								usersList: {
									type: 'array',
									items: { type: 'string', format: 'user-id' },
								},
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
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

const chatBusierHourlyDataEndpoints = API.v1.get(
	'engagement-dashboard/users/chat-busier/hourly-data',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		query: ajv.compile<{
			start: string;
		}>({
			type: 'object',
			properties: {
				start: {
					type: 'string',
					format: 'date-time',
					description: 'Start date',
				},
			},
			required: ['start'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				hours: {
					users: number;
					hour: number;
				}[];
			}>({
				type: 'object',
				properties: {
					hours: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								users: { type: 'number' },
								hour: { type: 'number' },
							},
							required: ['users', 'hour'],
							additionalProperties: false,
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['month', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

const chatBusierWeeklyDataEndpoints = API.v1.get(
	'engagement-dashboard/users/chat-busier/weekly-data',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		query: ajv.compile<{
			start: string;
		}>({
			type: 'object',
			properties: {
				start: {
					type: 'string',
					format: 'date-time',
					description: 'Start date',
				},
			},
			required: ['start'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				month: {
					users: number;
					day: number;
					month: number;
					year: number;
				}[];
			}>({
				type: 'object',
				properties: {
					month: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								users: { type: 'number' },
								day: { type: 'number' },
								month: { type: 'number' },
								year: { type: 'number' },
							},
							required: ['users', 'day', 'month', 'year'],
							additionalProperties: false,
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['month', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

const usersByTimeOfTheDayInAWeekEndpoints = API.v1.get(
	'engagement-dashboard/users/users-by-time-of-the-day-in-a-week',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		query: ajv.compile<{
			start: string;
			end: string;
		}>({
			type: 'object',
			properties: {
				start: {
					type: 'string',
					format: 'date-time',
					description: 'Start date',
				},
				end: {
					type: 'string',
					format: 'date-time',
					description: 'End date',
				},
			},
			required: ['start', 'end'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				week: {
					users: number;
					hour: number;
					day: number;
					month: number;
					year: number;
				}[];
			}>({
				type: 'object',
				properties: {
					week: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								users: { type: 'number' },
								hour: { type: 'number' },
								day: { type: 'number' },
								month: { type: 'number' },
								year: { type: 'number' },
							},
							required: ['users', 'hour', 'day', 'month', 'year'],
							additionalProperties: false,
						},
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['month', 'success'],
				additionalProperties: false,
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
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

type NewUsersEndpoints = ExtractRoutesFromAPI<typeof newUsersEndpoints>;

type ActiveUsersEndpoints = ExtractRoutesFromAPI<typeof activeUsersEndpoints>;

type ChatBusierHourlyDataEndpoints = ExtractRoutesFromAPI<typeof chatBusierHourlyDataEndpoints>;

type ChatBusierWeeklyDataEndpoints = ExtractRoutesFromAPI<typeof chatBusierWeeklyDataEndpoints>;

type UsersByTimeOfTheDayInAWeekEndpoints = ExtractRoutesFromAPI<typeof usersByTimeOfTheDayInAWeekEndpoints>;

export type EngagementDashboardUsersEndpoints =
	| NewUsersEndpoints
	| ActiveUsersEndpoints
	| ChatBusierHourlyDataEndpoints
	| ChatBusierWeeklyDataEndpoints
	| UsersByTimeOfTheDayInAWeekEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends NewUsersEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ActiveUsersEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ChatBusierHourlyDataEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ChatBusierWeeklyDataEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends UsersByTimeOfTheDayInAWeekEndpoints {}
}
