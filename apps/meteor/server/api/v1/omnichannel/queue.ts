import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	isGETLivechatQueueParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../..';
import { findQueueMetrics } from './lib/queue';
import { getPaginationItems } from '../../lib/getPaginationItems';

const queueMetricsResponseSchema = ajv.compile<
	PaginatedResult<{
		queue: {
			user: { _id: string; username: string; status: string };
			department: { _id?: string; name?: string };
			chats: number;
		}[];
	}>
>({
	type: 'object',
	properties: {
		queue: {
			type: 'array',
			// Shape matches the getQueueMetrics aggregation projection: `_id: 0` (no top-level _id),
			// `user` has _id/username/status, and `department` uses preserveNullAndEmptyArrays so its
			// _id/name are absent when the queued room has no department yet (serializes to `{}`).
			items: {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
							status: { type: 'string' },
						},
						required: ['_id', 'username', 'status'],
						additionalProperties: false,
					},
					department: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
						},
						additionalProperties: false,
					},
					chats: { type: 'number' },
				},
				required: ['user', 'department', 'chats'],
				additionalProperties: false,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['queue', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'livechat/queue',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		query: isGETLivechatQueueParams,
		response: {
			200: queueMetricsResponseSchema,
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
