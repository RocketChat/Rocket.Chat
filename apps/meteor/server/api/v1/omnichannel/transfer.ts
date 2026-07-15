import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../..';
import { findLivechatTransferHistory } from './lib/transfer';
import { getPaginationItems } from '../../lib/getPaginationItems';

const transferHistoryResponseSchema = ajv.compile<PaginatedResult<{ history: IOmnichannelSystemMessage['transferData'][] }>>({
	type: 'object',
	properties: {
		history: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					comment: { type: 'string' },
					ts: { type: 'string' },
					transferredBy: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
							username: { type: 'string' },
							userType: { type: 'string' },
						},
						required: ['username'],
						additionalProperties: false,
					},
					transferredTo: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
							username: { type: 'string' },
							userType: { type: 'string' },
						},
						required: ['username'],
						additionalProperties: false,
					},
					nextDepartment: {
						type: 'object',
						properties: { _id: { type: 'string' }, name: { type: 'string' } },
						required: ['_id'],
						additionalProperties: false,
					},
					scope: { type: 'string', enum: ['department', 'agent', 'queue'] },
				},
				required: ['comment', 'transferredBy', 'scope'],
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

API.v1.get(
	'livechat/transfer.history/:rid',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-rooms'],
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
			return API.v1.failure('invalid-room');
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
