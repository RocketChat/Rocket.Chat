import type { IUserWithRoleInfo, ISubscription } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';
import type { AggregationCursor, FilterOperators } from 'mongodb';

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
}: FindUsersParam): Promise<AggregationCursor<{ members: IUserWithRoleInfo[]; totalCount: { total: number }[] }>> {
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
			statusConnection: -1 as const,
			...(sort || { ...(settings.get('UI_Use_Real_Name') && { name: 1 }), username: 1 }),
		},
		skip,
		limit,
	};

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	const ownersIds = (await Subscriptions.findByRoomIdAndHighestRole(rid, 'owner', { projection: { 'u._id': 1 } }).toArray()).map(
		(s: ISubscription) => s.u?._id,
	);
	const moderatorsIds = (await Subscriptions.findByRoomIdAndHighestRole(rid, 'moderator', { projection: { 'u._id': 1 } }).toArray()).map(
		(s: ISubscription) => s.u?._id,
	);
	return Users.findPaginatedActiveUsersByRoomIdWithHighestRole(filter, rid, searchFields, ownersIds, moderatorsIds, options, [
		{
			...(status && { status }),
		},
	]);
}
