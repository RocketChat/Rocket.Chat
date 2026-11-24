import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	paginatedResponseProperties,
	isGETLivechatQueueParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { findQueueMetrics } from './lib/queue';
import { API } from '../..';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { getPaginationItems } from '../../lib/getPaginationItems';

const livechatQueueResponseSchema = ajv.compile<
	PaginatedResult<{
		queue: {
			chats: number;
			user: {
				_id: string;
				username?: string;
				status?: string;
			};
			department?: {
				_id?: string;
				name?: string;
			};
		}[];
	}>
>({
	type: 'object',
	properties: {
		queue: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					chats: { type: 'number' },
					department: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
						},
						additionalProperties: false,
					},
					user: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
							status: { type: 'string' },
						},
						required: ['_id'],
						additionalProperties: false,
					},
				},
				required: ['chats', 'user'],
				additionalProperties: false,
			},
		},
		...paginatedResponseProperties,
		success: { type: 'boolean', enum: [true] },
	},
	required: ['queue', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const livechatQueueEndpoints = API.v1.get(
	'livechat/queue',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		query: isGETLivechatQueueParams,
		response: {
			200: livechatQueueResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();
		const { agentId, includeOfflineAgents, departmentId } = this.queryParams;
		const users = await findQueueMetrics({
			agentId,
			includeOfflineAgents: includeOfflineAgents === 'true',
			departmentId,
			pagination: {
				offset,
				count,
				sort,
			},
		});
		return API.v1.success(users);
	},
);

type LivechatQueueEndpoints = ExtractRoutesFromAPI<typeof livechatQueueEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatQueueEndpoints {}
}
