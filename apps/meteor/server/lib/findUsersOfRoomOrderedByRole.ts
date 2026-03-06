import { type IUser, ROOM_ROLE_PRIORITY_MAP, type ISubscription } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Document, FilterOperators } from 'mongodb';

import { settings } from '../../app/settings/server';

type FindUsersParam = {
	rid: string;
	status?: FilterOperators<string>;
	skip?: number;
	limit?: number;
	filter?: string;
	sort?: Record<string, any>;
	exceptions?: string[];
	extraQuery?: Document[];
};

type UserWithRoleAndSubscriptionData = IUser & {
	subscription: Pick<ISubscription, '_id' | 'status' | 'ts' | 'roles'>;
};

export async function findUsersOfRoomOrderedByRole({
	rid,
	status,
	skip = 0,
	limit = 0,
	filter = '',
	sort = {},
	exceptions = [],
	extraQuery = [],
}: FindUsersParam): Promise<{ members: UserWithRoleAndSubscriptionData[]; total: number }> {
	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');
	const termRegex = new RegExp(escapeRegExp(filter), 'i');
	const orStmt = filter && searchFields.length ? searchFields.map((field) => ({ [field.trim()]: termRegex })) : [];

	const { rolePriority: rolePrioritySort, username: usernameSort } = sort;

	const sortCriteria = {
		rolePriority: rolePrioritySort ?? 1,
		statusSortKey: -1,
		...(usernameSort
			? { username: usernameSort }
			: {
					...(settings.get('UI_Use_Real_Name') ? { name: 1 } : { username: 1 }),
				}),
	};

	const matchUserFilter = {
		$and: [
			{
				__rooms: rid,
				active: true,
				username: {
					$exists: true,
					...(exceptions.length > 0 && { $nin: exceptions }),
				},
				...(status && { status }),
				...(filter && orStmt.length > 0 && { $or: orStmt }),
			},
			...extraQuery,
		],
	};

	const membersResult = Users.col.aggregate<UserWithRoleAndSubscriptionData>(
		[
			{
				$match: matchUserFilter,
			},
			{
				$project: {
					_id: 1,
					name: 1,
					username: 1,
					nickname: 1,
					status: 1,
					avatarETag: 1,
					_updatedAt: 1,
					federated: 1,
					statusSortKey: {
						// Adding this because offline users should come last
						$cond: [{ $eq: ['$status', 'offline'] }, null, '$status'],
					},
					rolePriority: {
						$ifNull: [`$roomRolePriorities.${rid}`, ROOM_ROLE_PRIORITY_MAP.default],
					},
				},
			},
			{ $sort: sortCriteria },
			...(skip > 0 ? [{ $skip: skip }] : []),
			...(limit > 0 ? [{ $limit: limit }] : []),
			{
				$lookup: {
					from: Subscriptions.getCollectionName(),
					localField: '_id',
					foreignField: 'u._id',
					as: 'subscription',
				},
			},
			{
				$addFields: {
					subscription: {
						$filter: {
							input: '$subscription',
							as: 'sub',
							cond: { $eq: ['$$sub.rid', rid] },
						},
					},
				},
			},
			{
				$addFields: {
					roles: { $arrayElemAt: ['$subscription.roles', 0] },
				},
			},
			{
				$unwind: {
					path: '$subscription',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$project: {
					statusSortKey: 0,
				},
			},
		],
		{
			allowDiskUse: true,
		},
	);

	const [members, totalCount] = await Promise.all([membersResult.toArray(), Users.countDocuments(matchUserFilter)]);

	return {
		members: members.map((member: any) => {
			delete member.rolePriority;
			return member;
		}),
		total: totalCount,
	};
}
