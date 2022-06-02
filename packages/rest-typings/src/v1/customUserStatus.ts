import type { ICustomUserStatus, IUserStatus } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomUserStatusEndpoints = {
	'custom-user-status.list': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			statuses: IUserStatus[];
		}>;
	};
	'custom-user-status.create': {
		POST: (params: { name: string; statusType?: string }) => {
			customUserStatus: ICustomUserStatus;
		};
	};
	'custom-user-status.delete': {
		POST: (params: { customUserStatusId: string }) => void;
	};
	'custom-user-status.update': {
		POST: (params: { id: string; name?: string; statusType?: string }) => {
			customUserStatus: ICustomUserStatus;
		};
	};
};
