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

	const userLookupPipeline: Document[] = [{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } }];

	if (status) {
		userLookupPipeline.push({ $match: { status } });
	}

	userLookupPipeline.push(
		{
			$match: {
				$and: [
					{
						active: true,
						username: {
							$exists: true,
							...(exceptions.length > 0 && { $nin: exceptions }),
						},
						...(filter && orStmt.length > 0 && { $or: orStmt }),
					},
					...extraQuery,
				],
			},
		},
		{
			$project: {
				_id: 1,
				username: 1,
				name: 1,
				nickname: 1,
				status: 1,
				avatarETag: 1,
				_updatedAt: 1,
				federated: 1,
				statusConnection: 1,
			},
		},
	);

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
	];

	const facetPipeline: Document[] = [
		{ $match: { rid } },
		{
			$facet: {
				totalCount: [{ $match: { rid } }, ...filteredPipeline, { $count: 'total' }],
				members: [
					{ $match: { rid } },
					...filteredPipeline,
					{ $sort: sortCriteria },
					...(skip > 0 ? [{ $skip: skip }] : []),
					...(limit > 0 ? [{ $limit: limit }] : []),
				],
			},
		},
		{
			$project: {
				members: 1,
				totalCount: { $arrayElemAt: ['$totalCount.total', 0] },
			},
		},
	];

	const [result] = await Subscriptions.col.aggregate(facetPipeline, { allowDiskUse: true }).toArray();

	return {
		members: result.members.map((member: any) => {
			delete member.primaryRole;
			delete member.rolePriority;
			return member;
		}),
		total: result.totalCount,
	};
}
