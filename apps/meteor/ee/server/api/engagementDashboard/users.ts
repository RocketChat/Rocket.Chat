import type { IUser } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
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

const commonBadRequestErrorSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'error'],
	additionalProperties: false,
	description: 'Bad Request',
};

const commonUnauthorizedErrorSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
		},
		message: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['status', 'message'],
	additionalProperties: false,
	description: 'Unauthorized',
};

const forbiddenRequestResponseSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'error'],
	additionalProperties: false,
	description: 'Forbidden',
};

const userActivityQuerySchema = {
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
};

interface IQuery {
	start: string;
	end: string;
}

API.v1
	.get(
		'engagement-dashboard/users/new-users',
		{
			authRequired: true,
			permissionsRequired: ['view-engagement-dashboard'],
			license: ['engagement-dashboard'],
			query: ajv.compile<IQuery>(userActivityQuerySchema),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						days: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									day: {
										type: 'string',
										format: 'date-time',
									},
									users: {
										type: 'integer',
										description: 'Number of users registered on that day',
									},
								},
								required: ['day', 'users'],
								additionalProperties: false,
							},
						},
						period: {
							type: 'object',
							properties: {
								count: {
									type: 'integer',
									description: 'Number of users registered in the period',
								},
								variation: {
									type: 'integer',
									description: 'Variation of users registered in the period',
								},
							},
							required: ['count', 'variation'],
							additionalProperties: false,
						},
						yesterday: {
							type: 'object',
							properties: {
								count: {
									type: 'integer',
									description: 'Number of users registered in the period',
								},
								variation: {
									type: 'integer',
									description: 'Variation of users registered in the period',
								},
							},
							required: ['count', 'variation'],
							additionalProperties: false,
						},
						success: { type: 'boolean' },
					},
					required: ['days', 'period', 'yesterday', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
				403: ajv.compile(forbiddenRequestResponseSchema),
			},
		},
		async function () {
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
	)
	.get(
		'engagement-dashboard/users/active-users',
		{
			authRequired: true,
			permissionsRequired: ['view-engagement-dashboard'],
			license: ['engagement-dashboard'],
			query: ajv.compile<IQuery>(userActivityQuerySchema),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						month: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									usersList: {
										type: 'array',
										items: {
											type: 'string',
										},
									},
									users: {
										type: 'integer',
										description: 'Number of users active on that day',
									},
									day: {
										type: 'integer',
										description: 'Day of the month',
									},
									month: {
										type: 'integer',
										description: 'Month of the year',
									},
									year: {
										type: 'integer',
										description: 'Year of the date',
									},
								},
								required: ['usersList', 'users', 'day', 'month', 'year'],
								additionalProperties: false,
							},
						},
						success: { type: 'boolean' },
					},
					required: ['month', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
				403: ajv.compile(forbiddenRequestResponseSchema),
			},
		},
		async function () {
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
	)
	.get(
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
				200: ajv.compile({
					type: 'object',
					properties: {
						hours: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									users: {
										type: 'integer',
										description: 'Number of users active on that hour',
									},
									hour: {
										type: 'integer',
										description: 'Hour of the day',
									},
								},
								required: ['users', 'hour'],
								additionalProperties: false,
							},
						},
						success: { type: 'boolean' },
					},
					required: ['hours', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
				403: ajv.compile(forbiddenRequestResponseSchema),
			},
		},
		async function () {
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
	)
	.get(
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
				200: ajv.compile({
					type: 'object',
					properties: {
						month: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									users: {
										type: 'integer',
										description: 'Number of users active on that hour',
									},
									day: {
										type: 'integer',
										description: 'Day of the month',
									},
									month: {
										type: 'integer',
										description: 'Month of the year',
									},
									year: {
										type: 'integer',
										description: 'Year of the date',
									},
								},
								required: ['users', 'day', 'month', 'year'],
								additionalProperties: false,
							},
						},
						success: { type: 'boolean' },
					},
					required: ['month', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
				403: ajv.compile(forbiddenRequestResponseSchema),
			},
		},
		async function () {
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
	)
	.get(
		'engagement-dashboard/users/users-by-time-of-the-day-in-a-week',
		{
			authRequired: true,
			permissionsRequired: ['view-engagement-dashboard'],
			license: ['engagement-dashboard'],
			query: ajv.compile<IQuery>(userActivityQuerySchema),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						week: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									users: {
										type: 'integer',
										description: 'Number of users active on that hour',
									},
									hour: {
										type: 'integer',
										description: 'Hour of the day',
									},
									day: {
										type: 'integer',
										description: 'Day of the month',
									},
									month: {
										type: 'integer',
										description: 'Month of the year',
									},
									year: {
										type: 'integer',
										description: 'Year of the date',
									},
								},
								required: ['users', 'hour', 'day', 'month', 'year'],
								additionalProperties: false,
							},
						},
						success: { type: 'boolean' },
					},
					required: ['week', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
				403: ajv.compile(forbiddenRequestResponseSchema),
			},
		},
		async function () {
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
