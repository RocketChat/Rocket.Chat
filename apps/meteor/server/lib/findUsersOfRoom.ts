import type { IUser, UserStatus } from '@rocket.chat/core-typings';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { Users } from '@rocket.chat/models';
import type { FindCursor, FindOptions } from 'mongodb';

import { settings } from '../settings';
import { effectiveStatusFilter, excludingOfflineFilter } from './statusVisibility/effectiveStatus';

type FindUsersParam = {
	rid: string;
	status?: UserStatus[] | 'not-offline';
	hidden?: Set<IUser['_id']>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export function findUsersOfRoom({
	rid,
	status,
	hidden,
	skip = 0,
	limit = 0,
	filter = '',
	sort,
}: FindUsersParam): FindPaginated<FindCursor<IUser>> {
	const options: FindOptions<IUser> = {
		projection: {
			name: 1,
			username: 1,
			nickname: 1,
			status: 1,
			avatarETag: 1,
			_updatedAt: 1,
			federated: 1,
		},
		sort: {
			...(hidden?.size ? {} : { statusConnection: -1 }),
			...(sort || { ...(settings.get('UI_Use_Real_Name') && { name: 1 }), username: 1 }),
		},
		...(skip > 0 && { skip }),
		...(limit > 0 && { limit }),
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	const statusFilter = Array.isArray(status) ? effectiveStatusFilter(status, hidden) : status && excludingOfflineFilter(hidden);

	return Users.findPaginatedByActiveUsersExcept(filter, undefined, options, searchFields, [
		{ __rooms: rid },
		...(statusFilter ? [statusFilter] : []),
	]);
}
