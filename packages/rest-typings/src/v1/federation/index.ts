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
export * from './FederationVerifyMatrixIdProps';
