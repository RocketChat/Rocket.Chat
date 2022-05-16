import type { IRoom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type DirectoryEndpoint = {
	directory: {
		GET: (
			params: PaginatedRequest<{
				query: { [key: string]: string };
				sort: { [key: string]: number };
			}>,
		) => PaginatedResult<{ result: IRoom[] }>;
	};
};
