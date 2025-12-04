import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import { CallHistory, MediaCalls } from '@rocket.chat/models';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { ajv, validateNotFoundErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type CallHistoryList = PaginatedRequest<Record<never, never>>;

const CallHistoryListSchema = {
	type: 'object',
	properties: {
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isCallHistoryListProps = ajv.compile<CallHistoryList>(CallHistoryListSchema);

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
		},
		query: isCallHistoryListProps,
		authRequired: true,
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort } = await this.parseJsonQuery();

		const filter = {
			uid: this.userId,
		};

		const { cursor, totalCount } = CallHistory.findPaginated(filter, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
		});
		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({
			items,
			count: items.length,
			offset,
			total,
		});
	},
);

type CallHistoryListEndpoints = ExtractRoutesFromAPI<typeof callHistoryListEndpoints>;

type CallHistoryInfo = { historyId: string; callId: never } | { callId: string; historyId: never };

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

export const isCallHistoryInfoProps = ajv.compile<CallHistoryInfo>(CallHistoryInfoSchema);

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
				},
				required: ['item'],
			}),
			400: validateBadRequestErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		query: isCallHistoryInfoProps,
		authRequired: true,
	},
	async function action() {
		if (!this.queryParams.historyId && !this.queryParams.callId) {
			return API.v1.failure();
		}

		const item = await (this.queryParams.historyId
			? CallHistory.findOneByIdAndUid(this.queryParams.historyId, this.userId)
			: CallHistory.findOneByCallIdAndUid(this.queryParams.callId, this.userId));

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

export type CallHistoryEndpoints = CallHistoryListEndpoints | CallHistoryInfoEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CallHistoryListEndpoints {}

	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CallHistoryInfoEndpoints {}
}
