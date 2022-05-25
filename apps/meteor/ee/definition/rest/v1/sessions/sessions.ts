import type { ISession, DeviceManagementSession, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../../../../../../packages/rest-typings/src/helpers/PaginatedRequest';
import type { PaginatedResult } from '../../../../../../../packages/rest-typings/src/helpers/PaginatedResult';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'sessions/list': {
			GET: (params: PaginatedRequest<{ filter?: string }>) => PaginatedResult<{ sessions: DeviceManagementSession[] }>;
		};
		'sessions/info': {
			GET: (params: { sessionId: string }) => DeviceManagementSession;
		};
		'sessions/logout.me': {
			POST: (params: { sessionId: string }) => Pick<ISession, 'sessionId'>;
		};
		'sessions/list.all': {
			GET: (params: PaginatedRequest<{ filter?: string }>) => PaginatedResult<{ sessions: DeviceManagementPopulatedSession[] }>;
		};
		'sessions/info.admin': {
			GET: (params: { sessionId: string }) => DeviceManagementPopulatedSession;
		};
		'sessions/logout': {
			POST: (params: { sessionId: string }) => Pick<ISession, 'sessionId'>;
		};
	}
}
