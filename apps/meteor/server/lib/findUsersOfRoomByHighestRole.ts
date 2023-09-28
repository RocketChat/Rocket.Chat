import type { IUserWithRoleInfo, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';
import type { FilterOperators, FindOptions } from 'mongodb';

import { settings } from '../../app/settings/server';

type FindUsersParam = {
	rid: string;
	status?: FilterOperators<string>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
};

async function findUsersWithRolesOfRoom(
	{ rid, status, limit = 0, filter = '' }: FindUsersParam,
	options: FindOptions<IUser>,
): Promise<{ members: IUserWithRoleInfo[]; totalCount: number; allMembersIds: string[] }> {
	// Sort roles in descending order so that owners are listed before moderators
	// This could possibly cause issues with custom roles, but that's intended to improve performance
	const highestRolesMembersSubscriptions = await Subscriptions.findByRoomIdAndRoles(rid, ['owner', 'moderator'], {
		projection: { 'u._id': 1, 'roles': 1 },
		sort: { roles: -1 },
	}).toArray();

	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	const totalCount = highestRolesMembersSubscriptions.length;
	const allMembersIds = highestRolesMembersSubscriptions.map((s: ISubscription) => s.u?._id);
	const highestRolesMembersIdsToFind = allMembersIds.slice(0, limit);

	const { cursor } = Users.findPaginatedActiveUsersByIds(filter, searchFields, highestRolesMembersIdsToFind, options, [
		{
			__rooms: rid,
			...(status && { status }),
		},
	]);
	const highestRolesMembers = await cursor.toArray();

	// maps for efficient lookup of highest roles and sort order
	const ordering: Record<string, number> = {};
	const highestRoleById: Record<string, string> = {};

	const limitedHighestRolesMembersSubs = highestRolesMembersSubscriptions.slice(0, limit);
	limitedHighestRolesMembersSubs.forEach((sub, index) => {
		ordering[sub.u._id] = index;
		highestRoleById[sub.u._id] = sub.roles?.includes('owner') ? 'owner' : 'moderator';
	});

	highestRolesMembers.sort((a, b) => ordering[a._id] - ordering[b._id]);
	const membersWithHighestRoles = highestRolesMembers.map(
		(member): IUserWithRoleInfo => ({
			...member,
			highestRole: {
				role: highestRoleById[member._id],
				level: highestRoleById[member._id] === 'owner' ? 0 : 1,
			},
		}),
	);
	return { members: membersWithHighestRoles, totalCount, allMembersIds };
}

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
	const extraQuery = {
		__rooms: rid,
		...(status && { status }),
	};
	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

	// Find highest roles members (owners and moderator)
	const {
		members: highestRolesMembers,
		totalCount: totalMembersWithRoles,
		allMembersIds: highestRolesMembersIds,
	} = await findUsersWithRolesOfRoom({ rid, status, limit, filter }, options);

	if (limit <= highestRolesMembers.length) {
		const totalMembersCount = await Users.countActiveUsersExcept(filter, highestRolesMembersIds, searchFields, [extraQuery]);
		return { members: highestRolesMembers, total: totalMembersWithRoles + totalMembersCount };
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
	return { members: allMembers, total: totalMembersWithRoles + totalMembersCount };
}
