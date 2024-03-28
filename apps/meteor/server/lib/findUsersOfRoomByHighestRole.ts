import type { IUserWithRoleInfo, IUser, IRoom, UserStatus } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';
import type { Filter, FilterOperators, FindOptions } from 'mongodb';

import { settings } from '../../app/settings/server';

type FindUsersParam = {
	rid: string;
	status?: FilterOperators<UserStatus>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

export async function findUsersOfRoomByHighestRole({
	rid,
	status,
	limit = 0,
	filter = '',
	sort,
}: FindUsersParam): Promise<{ members: IUserWithRoleInfo[]; total: number }> {
	const options: FindOptions<IUser> = {
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
		limit,
	};
	const extraQuery: Filter<IUser & { __rooms: IRoom['_id'][] }> = {
		__rooms: rid,
		...(status && { status }),
	};
	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	// Find highest roles members (owners and moderators)
	const result = await Subscriptions.findPaginatedActiveHighestRoleUsers(filter, rid, searchFields, options, extraQuery);
	const {
		members: highestRolesMembers = [],
		totalCount: totalMembersWithRoles = { total: 0 },
		ids = { allMembersIds: [] },
	} = result[0] || {};
	const { total: totalMembersWithRolesCount } = totalMembersWithRoles;
	const { allMembersIds: highestRolesMembersIds } = ids;

	if (limit <= highestRolesMembers.length) {
		const totalMembersCount = await Users.countActiveUsersExcept(filter, highestRolesMembersIds, searchFields, [extraQuery]);
		return { members: highestRolesMembers, total: totalMembersWithRolesCount + totalMembersCount };
	}
	if (options.limit) {
		options.limit -= highestRolesMembers.length;
	}

	// Find average members
	const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept(filter, highestRolesMembersIds, searchFields, options, [
		extraQuery,
	]);
	const [members, totalMembersCount] = await Promise.all([await cursor.toArray(), totalCount]);
	const membersWithHighestRoles = members.map(
		(member): IUserWithRoleInfo => ({
			...member,
			highestRole: {
				role: 'member',
				level: 2,
			},
		}),
	);

	const allMembers = highestRolesMembers.concat(membersWithHighestRoles);
	return { members: allMembers, total: totalMembersWithRolesCount + totalMembersCount };
}
