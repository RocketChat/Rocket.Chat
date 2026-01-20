import { ICallHistoryItemSchema, CallHistoryItemStateSchema, CallHistoryItemSchema, IMediaCallsSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';
import { PaginatedRequestSchema } from '../helpers/PaginatedRequest';
import { PaginatedResultSchema } from '../helpers/PaginatedResult';

export const GETCallHistoryListQuerySchema = z
	.object({
		filter: z.string().optional(),
		direction: ICallHistoryItemSchema.shape.direction.optional(),
		state: z.union([CallHistoryItemStateSchema, z.array(CallHistoryItemStateSchema)]).optional(),
	})
	.and(PaginatedRequestSchema);

export const GETCallHistoryListResponseSchema = SuccessResponseSchema.extend({
	items: z.array(CallHistoryItemSchema),
}).and(PaginatedResultSchema);

export const GETCallHistoryInfoQuerySchema = z.union([z.object({ historyId: z.string() }), z.object({ callId: z.string() })]);

export const GETCallHistoryInfoResponseSchema = SuccessResponseSchema.extend({
	item: CallHistoryItemSchema,
	call: IMediaCallsSchema.optional(),
});
