import type { IUser } from '@rocket.chat/core-typings';
import type { AggregationCursor, FilterOperators } from 'mongodb';
import { Users } from '@rocket.chat/models';

import { settings } from '../../app/settings/server';

type FindUsersParam = {
	rid: string;
	status?: FilterOperators<string>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export async function findUsersOfRoomByHighestRole({
	rid,
	status,
	skip = 0,
	limit = 0,
	filter = '',
	sort,
}: FindUsersParam): Promise<AggregationCursor<{ members: IUser[]; totalCount: { total: number }[] }>> {
	const options = {
		projection: {
			name: 1,
			username: 1,
			nickname: 1,
			status: 1,
			avatarETag: 1,
			_updatedAt: 1,
			federated: 1,
			statusConnection: 1,
		},
		sort: {
			statusConnection: -1,
			...(sort || { ...(settings.get('UI_Use_Real_Name') && { name: 1 }), username: 1 }),
		},
		skip,
		limit,
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	return Users.findPaginatedActiveUsersByRoomIdWithHighestRole(filter, rid, options, searchFields, [
		{
			...(status && { status }),
		},
	]);
}
