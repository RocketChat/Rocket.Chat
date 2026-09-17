import type { IDirectMessageRoom, IRoom } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { check, Match } from 'meteor/check';

import { API } from '../../../../server/api';
import { getPaginationItems } from '../../../../server/api/lib/getPaginationItems';
import { findChannelsWithNumberOfMessages } from '../../lib/engagementDashboard/channels';
import { isDateISOString, mapDateForAPI } from '../../lib/engagementDashboard/date';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/engagement-dashboard/channels/list': {
			GET: (params: { start: string; end: string; offset?: number; count?: number }) => {
				channels: {
					room: {
						_id: IRoom['_id'];
						name: IRoom['name'];
						ts: IRoom['ts'];
						t: IRoom['t'];
						_updatedAt: IRoom['_updatedAt'];
						usernames?: IDirectMessageRoom['usernames'];
					};
					messages: number;
					lastWeekMessages: number;
					diffFromLastWeek: number;
				}[];
				count: number;
				offset: number;
				total: number;
			};
		};
	}
}

const channelsListResponseSchema = ajv.compile<{
	channels: {
		room: {
			_id: IRoom['_id'];
			name: IRoom['name'];
			ts: IRoom['ts'];
			t: IRoom['t'];
			_updatedAt: IRoom['_updatedAt'];
			usernames?: IDirectMessageRoom['usernames'];
		};
		messages: number;
		lastWeekMessages: number;
		diffFromLastWeek: number;
	}[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		channels: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					room: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
							ts: { type: 'string', format: 'date-time' },
							t: { type: 'string' },
							_updatedAt: { type: 'string', format: 'date-time' },
							usernames: { type: 'array', items: { type: 'string' } },
						},
						required: ['_id'],
						additionalProperties: false,
					},
					messages: { type: 'number' },
					lastWeekMessages: { type: 'number' },
					diffFromLastWeek: { type: 'number' },
				},
				required: ['room', 'messages', 'lastWeekMessages', 'diffFromLastWeek'],
				additionalProperties: false,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channels', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'engagement-dashboard/channels/list',
	{
		authRequired: true,
		permissionsRequired: ['view-engagement-dashboard'],
		license: ['engagement-dashboard'],
		response: {
			200: channelsListResponseSchema,
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
				offset: Match.Maybe(String),
				count: Match.Maybe(String),
			}),
		);

		const { start, end } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);

		const { channels, total } = await findChannelsWithNumberOfMessages({
			start: mapDateForAPI(start),
			end: mapDateForAPI(end),
			options: { offset, count },
		});

		return API.v1.success({
			channels,
			total,
			offset,
			count: channels.length,
		});
	},
);
