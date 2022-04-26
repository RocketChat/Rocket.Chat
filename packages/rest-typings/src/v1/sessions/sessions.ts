import type { ISession } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export type SessionsEndpoints = {
	'sessions.list': {
		GET: (params: PaginatedRequest<{ search?: string }>) => PaginatedResult<{ sessions: ISession[] }>;
	};

	'sessions.list.all': {
		GET: (params: PaginatedRequest<{ search?: string }>) => PaginatedResult<{ sessions: ISession[] }>;
	};
};
