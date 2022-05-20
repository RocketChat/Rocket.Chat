import type { IUserStatus } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomUserStatusEndpoints = {
	'custom-user-status.list': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			statuses: IUserStatus[];
		}>;
	};
};
