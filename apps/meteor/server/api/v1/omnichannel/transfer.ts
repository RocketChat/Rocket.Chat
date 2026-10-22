import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
// eslint-disable-next-line import-x/named
import { Meteor } from 'meteor/meteor';

import { findLivechatTransferHistory } from './lib/transfer';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { API } from '../../api';
import { getPaginationItems } from '../../lib/getPaginationItems';

const transferHistoryResponseSchema = ajv.compile<{
	history: IOmnichannelSystemMessage['transferData'][];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		history: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					transferredBy: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
							name: { type: 'string' },
							userType: { type: 'string' },
						},
						required: ['username'],
						additionalProperties: false,
					},
					transferredTo: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							agentId: { type: 'string' },
							username: { type: 'string' },
							name: { type: 'string' },
						},
						additionalProperties: false,
					},
					nextDepartment: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
						},
						required: ['_id'],
						additionalProperties: false,
					},
					previousDepartment: {
						oneOf: [
							{ type: 'string' },
							{
								type: 'object',
								properties: {
									_id: { type: 'string' },
									name: { type: 'string' },
								},
								required: ['_id'],
								additionalProperties: false,
							},
						],
					},
					scope: {
						type: 'string',
						enum: ['department', 'agent', 'queue', 'autoTransferUnansweredChatsToQueue', 'autoTransferUnansweredChatsToAgent'],
					},
					comment: { type: 'string' },
					ts: { type: 'string', format: 'date-time' },
				},
				required: ['transferredBy', 'scope'],
				additionalProperties: false,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['history', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const transferHistoryParamsSchema = ajv.compile<{
	count?: number;
	offset?: number;
	sort?: string;
	query?: string;
}>({
	type: 'object',
	properties: {
		count: { type: 'number', minimum: 0 },
		offset: { type: 'number', minimum: 0 },
		sort: { type: 'string' },
		query: { type: 'string' },
	},
	additionalProperties: false,
});

const livechatTransferEndpoints = API.v1.get(
	'livechat/transfer.history/:rid',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-rooms'],
		query: transferHistoryParamsSchema,
		response: {
			200: transferHistoryResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { rid } = this.urlParams;

		const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1 } });
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (!transferHistoryParamsSchema(this.queryParams)) {
			throw new Meteor.Error(
				'error-invalid-params',
				transferHistoryParamsSchema.errors?.map((error) => error.message).join('\n ') || 'Invalid query parameters',
			);
		}

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		const history = await findLivechatTransferHistory({
			rid,
			pagination: {
				offset,
				count,
				sort,
			},
		});

		return API.v1.success(history);
	},
);

type LivechatTransferEndpoints = ExtractRoutesFromAPI<typeof livechatTransferEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatTransferEndpoints {}
}
