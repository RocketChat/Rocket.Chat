import { CallHistory as CallHistoryService } from '@rocket.chat/core-services';
import type { CallHistoryItem, CallHistoryItemState, IMediaCall } from '@rocket.chat/core-typings';
import { CallHistory, MediaCalls } from '@rocket.chat/models';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	ajvQuery,
	validateNotFoundErrorResponse,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { ensureArray } from '../../../../lib/utils/arrayUtils';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type CallHistoryList = PaginatedRequest<{
	filter?: string;
	direction?: CallHistoryItem['direction'];
	state?: CallHistoryItemState[];
}>;

const CallHistoryListSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		filter: {
			type: 'string',
		},
		direction: {
			type: 'string',
			enum: ['inbound', 'outbound'],
		},
		state: {
			type: 'array',
			items: {
				$ref: '#/components/schemas/CallHistoryItemState',
			},
		},
	},
	required: [],
	additionalProperties: false,
};

export const isCallHistoryListProps = ajvQuery.compile<CallHistoryList>(CallHistoryListSchema);

const callHistoryListEndpoints = API.v1.get(
	'call-history.list',
	{
		response: {
			200: ajv.compile<
				PaginatedResult<{
					items: CallHistoryItem[];
				}>
			>({
				additionalProperties: false,
				type: 'object',
				properties: {
					count: {
						type: 'number',
						description: 'The number of history items returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of history items that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of history items that match the query.',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
					items: {
						type: 'array',
						items: {
							$ref: '#/components/schemas/CallHistoryItem',
						},
					},
				},
				required: ['count', 'offset', 'total', 'items', 'success'],
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
		query: isCallHistoryListProps,
		authRequired: true,
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort } = await this.parseJsonQuery();

		const { direction, state, filter } = this.queryParams;

		const searchTerm = typeof filter === 'string' && filter.trim();

		const { items, total } = await CallHistoryService.search(
			this.userId,
			{
				...(searchTerm && { searchTerm }),
				...(direction && { direction }),
				...(state && { inStates: ensureArray(state) }),
			},
			{ count, offset, sort },
		);

		return API.v1.success({
			items,
			count: items.length,
			offset,
			total,
		});
	},
);

type CallHistoryListEndpoints = ExtractRoutesFromAPI<typeof callHistoryListEndpoints>;

type CallHistoryInfo = { historyId: string } | { callId: string };

const CallHistoryInfoSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				historyId: {
					type: 'string',
					nullable: false,
				},
			},
			required: ['historyId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				callId: {
					type: 'string',
					nullable: false,
				},
			},
			required: ['callId'],
			additionalProperties: false,
		},
	],
};

export const isCallHistoryInfoProps = ajvQuery.compile<CallHistoryInfo>(CallHistoryInfoSchema);

const callHistoryInfoEndpoints = API.v1.get(
	'call-history.info',
	{
		response: {
			200: ajv.compile<{
				item: CallHistoryItem;
				call?: IMediaCall;
			}>({
				additionalProperties: false,
				type: 'object',
				properties: {
					item: {
						$ref: '#/components/schemas/CallHistoryItem',
						description: 'The requested call history item.',
					},
					call: {
						type: 'object',
						$ref: '#/components/schemas/IMediaCall',
						description: 'The call information for the requested call history item.',
						nullable: true,
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['item', 'success'],
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		query: isCallHistoryInfoProps,
		authRequired: true,
	},
	async function action() {
		const { historyId, callId } = this.queryParams as Record<string, never> & typeof this.queryParams;

		if (!historyId && !callId) {
			return API.v1.failure();
		}

		const item = await (historyId
			? CallHistory.findOneByIdAndUid(historyId, this.userId)
			: CallHistory.findOneByCallIdAndUid(callId, this.userId));

		if (!item) {
			return API.v1.notFound();
		}

		if (item.type === 'media-call' && item.callId) {
			const call = await MediaCalls.findOneById(item.callId);
			if (call) {
				return API.v1.success({
					item,
					call,
				});
			}
		}

		return API.v1.success({ item });
	},
);

type CallHistoryInfoEndpoints = ExtractRoutesFromAPI<typeof callHistoryInfoEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CallHistoryListEndpoints {}

	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CallHistoryInfoEndpoints {}
}
