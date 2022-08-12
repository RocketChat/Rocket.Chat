import type { ISession, DeviceManagementSession, DeviceManagementPopulatedSession } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import type { SessionsPaginateProps } from './SessionsPaginateProps';
import type { SessionsProps } from './SessionsProps';

declare module '@rocket.chat/rest-typings' {
	interface Endpoints {
		'/v1/sessions/list': {
			GET: (params: SessionsPaginateProps) => PaginatedResult<{ sessions: Array<DeviceManagementSession> }>;
		};
		'/v1/sessions/info': {
			GET: (params: SessionsProps) => DeviceManagementSession;
		};
		'/v1/sessions/logout.me': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
		'/v1/sessions/list.all': {
			GET: (params: SessionsPaginateProps) => PaginatedResult<{ sessions: Array<DeviceManagementPopulatedSession> }>;
		};
		'/v1/sessions/info.admin': {
			GET: (params: SessionsProps) => DeviceManagementPopulatedSession;
		};
		'/v1/sessions/logout': {
			POST: (params: SessionsProps) => Pick<ISession, 'sessionId'>;
		};
	}
}
