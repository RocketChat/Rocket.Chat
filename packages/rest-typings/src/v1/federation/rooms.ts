import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export type FederationEndpoints = {
	'/v1/federation/searchPublicRooms': {
		GET: (params: PaginatedRequest<{ roomName: string }>) => PaginatedResult<{
			// files: IUpload[];
		}>;
	};
};
