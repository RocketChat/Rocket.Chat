import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../server/api';
import { isDateISOString, transformDatesForAPI } from '../../lib/engagementDashboard/date';
import {
	findWeeklyMessagesSentData,
	findMessagesSentOrigin,
	findTopFivePopularChannelsByMessageSentQuantity,
} from '../../lib/engagementDashboard/messages';

const weeklyDataResponseSchema = ajv.compile<{
	days: { day: Date; messages: number }[];
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
					messages: { type: 'number' },
				},
				required: ['day', 'messages'],
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

const messagesOriginResponseSchema = ajv.compile<{ origins: { t: IRoom['t']; messages: number }[] }>({
	type: 'object',
	properties: {
		origins: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					t: { type: 'string' },
					messages: { type: 'number' },
				},
				required: ['t', 'messages'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['origins', 'success'],
	additionalProperties: false,
});

const topFivePopularChannelsResponseSchema = ajv.compile<{
	channels: {
		t: IRoom['t'];
		messages: number;
		name: IRoom['name'];
		usernames?: IDirectMessageRoom['usernames'];
	}[];
}>({
	type: 'object',
	properties: {
		channels: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					t: { type: 'string' },
					messages: { type: 'number' },
					name: { type: 'string' },
					usernames: { type: 'array', items: { type: 'string' } },
				},
				required: ['t', 'messages'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channels', 'success'],
	additionalProperties: false,
});

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/messages/origin': {
			GET: (params: { start: string; end: string }) => {
				origins: {
					t: IRoom['t'];
					messages: number;
				}[];
			};
		};
		'/v1/engagement-dashboard/messages/top-five-popular-channels': {
			GET: (params: { start: string; end: string }) => {
				channels: {
					t: IRoom['t'];
					messages: number;
					name: IRoom['name'];
					usernames?: IDirectMessageRoom['usernames'];
				}[];
			};
		};
		'/v1/engagement-dashboard/messages/messages-sent': {
			GET: (params: { start: string; end: string }) => {
				days: { day: Date; messages: number }[];
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
	'engagement-dashboard/messages/messages-sent',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: weeklyDataResponseSchema,
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

		const data = await findWeeklyMessagesSentData(transformDatesForAPI(start, end));
		return API.v1.success(data);
	},
);

API.v1.get(
	'engagement-dashboard/messages/origin',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: messagesOriginResponseSchema,
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

		const data = await findMessagesSentOrigin(transformDatesForAPI(start, end));
		return API.v1.success(data);
	},
);

API.v1.get(
	'engagement-dashboard/messages/top-five-popular-channels',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: topFivePopularChannelsResponseSchema,
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

		const data = await findTopFivePopularChannelsByMessageSentQuantity(transformDatesForAPI(start, end));
		return API.v1.success(data);
	},
);
