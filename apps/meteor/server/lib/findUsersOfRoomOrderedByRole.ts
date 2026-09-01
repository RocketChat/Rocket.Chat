import { type IUser, ROOM_ROLE_PRIORITY_MAP, type ISubscription, type UserStatus } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Document } from 'mongodb';

import { settings } from '../settings';
import { effectiveStatusExpression, effectiveStatusFilter } from './statusVisibility/effectiveStatus';

type FindUsersParam = {
	rid: string;
	status?: UserStatus[];
	hidden?: Set<IUser['_id']>;
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
	hidden,
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
				...(filter && orStmt.length > 0 && { $or: orStmt }),
			},
			...(status ? [effectiveStatusFilter(status, hidden)] : []),
			...extraQuery,
		],
	};

	const visibleStatus = hidden?.size ? effectiveStatusExpression(hidden) : '$status';

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
					status: visibleStatus,
					avatarETag: 1,
					_updatedAt: 1,
					federated: 1,
					statusSortKey: {
						// Adding this because offline users should come last
						$cond: [{ $eq: [visibleStatus, 'offline'] }, null, visibleStatus],
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
					as: 'subscription',
					let: { userId: '$_id', roomId: rid },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$rid', '$$roomId'] }, { $eq: ['$u._id', '$$userId'] }],
								},
							},
						},
						{ $project: { roles: 1, status: 1, ts: 1 } },
					],
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
