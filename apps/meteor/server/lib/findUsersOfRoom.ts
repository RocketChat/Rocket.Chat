import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { Users } from '@rocket.chat/models';
import type { FindCursor, FindOptions } from 'mongodb';

import { settings } from '../settings';
import { effectiveStatusFilter, excludingOfflineFilter } from './statusVisibility/effectiveStatus';
import type { PresenceScope } from './statusVisibility/presenceScope';
import { NOTHING_HIDDEN, hiddenIds, scopeHidesAnyone } from './statusVisibility/presenceScope';

type FindUsersParam = {
	rid: string;
	status?: UserStatus[] | 'not-offline';
	scope?: PresenceScope;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export async function findUsersOfRoom({
	rid,
	status,
	scope = NOTHING_HIDDEN,
	skip = 0,
	limit = 0,
	filter = '',
	sort,
}: FindUsersParam): Promise<FindPaginated<FindCursor<IUser>>> {
	const hiddenCanAppear = scopeHidesAnyone(scope) && (!status || (Array.isArray(status) && status.includes(UserStatus.OFFLINE)));
	const hiddenInRoom =
		hiddenCanAppear &&
		(scope.hideAll ||
			(await Users.countDocuments({ __rooms: rid, active: true, username: { $exists: true }, _id: { $in: hiddenIds(scope) } })) > 0);

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
			...(hiddenInRoom ? {} : { statusConnection: -1 }),
			...(sort || { ...(settings.get('UI_Use_Real_Name') && { name: 1 }), username: 1 }),
		},
		...(skip > 0 && { skip }),
		...(limit > 0 && { limit }),
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	const statusFilter = Array.isArray(status) ? effectiveStatusFilter(status, scope) : status && excludingOfflineFilter(scope);

	return Users.findPaginatedByActiveUsersExcept(filter, undefined, options, searchFields, [
		{ __rooms: rid },
		...(statusFilter ? [statusFilter] : []),
	]);
}
