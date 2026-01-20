import * as z from 'zod';

import { SuccessResponseSchema } from '../Ajv';

export type FederationPaginatedRequest<T = Record<string, boolean | number | string | object>> = {
	count?: number;
	pageToken?: string;
} & T;

export type FederationPaginatedResult<T = Record<string, boolean | number | string | object>> = {
	count: number;
	nextPageToken?: string;
	previousPageToken?: string;
	total: number;
} & T;

export * from './rooms';
export * from './FederationJoinExternalPublicRoomProps';
export * from './FederationPublicRoomsProps';
export * from './FederationAddServerProps';
export * from './FederationRemoveServerProps';

export const GETFederationMatrixIdsVerifyQuerySchema = z.object({
	matrixIds: z.array(z.string()),
});

export const GETFederationMatrixIdsVerifyResponseSchema = SuccessResponseSchema.extend({
	results: z.record(z.string(), z.string()),
});
