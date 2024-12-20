import type { IUser, IRole } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
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
	rolesInOrder?: IRole['_id'][];
	exceptions?: string[];
	extraQuery?: Document[];
};

type UserWithRoleData = IUser & {
	roles: IRole['_id'][];
};

export async function findUsersOfRoomOrderedByRole({
	rid,
	status,
	skip = 0,
	limit = 0,
	filter = '',
	sort,
	rolesInOrder = [],
	exceptions = [],
	extraQuery = [],
}: FindUsersParam): Promise<{ members: UserWithRoleData[]; total: number }> {
	const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');
	const termRegex = new RegExp(escapeRegExp(filter), 'i');
	const orStmt = filter && searchFields.length ? searchFields.map((field) => ({ [field.trim()]: termRegex })) : [];

	const useRealName = settings.get('UI_Use_Real_Name');
	const defaultSort = useRealName ? { name: 1 } : { username: 1 };

	const sortCriteria = {
		rolePriority: 1,
		statusConnection: -1,
		...(sort || defaultSort),
	};

	const userLookupPipeline: Document[] = [
		{
			$match: {
				$and: [
					{
						$expr: { $eq: ['$_id', '$$userId'] },
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
			},
		},
	];

	const defaultPriority = rolesInOrder.length + 1;

	const branches = rolesInOrder.map((role, index) => ({
		case: { $eq: ['$$this', role] },
		then: index + 1,
	}));

	const filteredPipeline: Document[] = [
		{
			$lookup: {
				from: 'users',
				let: { userId: '$u._id' },
				pipeline: userLookupPipeline,
				as: 'userDetails',
			},
		},
		{ $unwind: '$userDetails' },
	];

	const membersResult = Subscriptions.col.aggregate(
		[
			{ $match: { rid } },
			...filteredPipeline,
			{
				$addFields: {
					primaryRole: {
						$reduce: {
							input: '$roles',
							initialValue: { role: null, priority: defaultPriority },
							in: {
								$let: {
									vars: {
										currentPriority: {
											$switch: {
												branches,
												default: defaultPriority,
											},
										},
									},
									in: {
										$cond: [
											{
												$and: [{ $in: ['$$this', rolesInOrder] }, { $lt: ['$$currentPriority', '$$value.priority'] }],
											},
											{ role: '$$this', priority: '$$currentPriority' },
											'$$value',
										],
									},
								},
							},
						},
					},
				},
			},
			{
				$addFields: {
					rolePriority: { $ifNull: ['$primaryRole.priority', defaultPriority] },
				},
			},
			{
				$project: {
					_id: '$userDetails._id',
					rid: 1,
					roles: 1,
					primaryRole: '$primaryRole.role',
					rolePriority: 1,
					username: '$userDetails.username',
					name: '$userDetails.name',
					nickname: '$userDetails.nickname',
					status: '$userDetails.status',
					avatarETag: '$userDetails.avatarETag',
					_updatedAt: '$userDetails._updatedAt',
					federated: '$userDetails.federated',
					statusConnection: '$userDetails.statusConnection',
				},
			},
			{ $sort: sortCriteria },
			...(skip > 0 ? [{ $skip: skip }] : []),
			...(limit > 0 ? [{ $limit: limit }] : []),
		],
		{
			allowDiskUse: true,
		},
	);

	const totalResult = Subscriptions.col.aggregate([{ $match: { rid } }, ...filteredPipeline, { $count: 'total' }], { allowDiskUse: true });

	const [members, [{ totalCount }]] = await Promise.all([membersResult.toArray(), totalResult.toArray()]);

	return {
		members: members.map((member: any) => {
			delete member.primaryRole;
			delete member.rolePriority;
			return member;
		}),
		total: totalCount,
	};
}
