import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomUserStatusEndpoints = {
	'custom-user-status.list': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			statuses: {
				_id: string;
				name: string;
				statusType: string | null;
			}[];
		}>;
	};
};
