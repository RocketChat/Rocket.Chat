import type { ISession, DeviceManagementSession, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';

import { SessionsProps } from './SessionsProps';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'sessions/list': {
			GET: (params: PaginatedRequest<{ filter?: string }>) => PaginatedResult<{ sessions: DeviceManagementSession[] }>;
		};
		'sessions/info': {
			GET: (params: SessionsProps) => DeviceManagementSession;
		};
		'sessions/logout.me': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
		'sessions/list.all': {
			GET: (params: PaginatedRequest<{ filter?: string }>) => PaginatedResult<{ sessions: DeviceManagementPopulatedSession[] }>;
		};
		'sessions/info.admin': {
			GET: (params: SessionsProps) => DeviceManagementPopulatedSession;
		};
		'sessions/logout': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
	}
}
