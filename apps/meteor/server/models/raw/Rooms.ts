import type { IDirectMessageRoom, IOmnichannelGenericRoom, IRoom, IRoomFederated, ITeam, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IRoomsModel } from '@rocket.chat/model-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
    AggregationCursor,
    Collection,
    Db,
    Document,
    Filter,
    FindCursor,
    FindOptions,
    UpdateFilter,
    UpdateOptions,
    UpdateResult
} from 'mongodb';
import { ReadPreference } from 'mongodb';

import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw<IRoom> implements IRoomsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IRoom>>) {
		super(db, 'room', trash);
	}

	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query = {
			'_id': rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findManyByRoomIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query = {
			_id: {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindPaginated<FindCursor<IRoom>> {
		return this.findPaginated(
			{
				_id: { $in: roomIds },
			},
			options,
		);
	}

	async getMostRecentAverageChatDurationTime(numberMostRecentChats: number, department: string | object): Promise<Document> {
		const aggregate = [
			{
				$match: {
					t: 'l',
					...(department && { departmentId: department }),
					closedAt: { $exists: true },
				},
			},
			{ $sort: { closedAt: -1 } },
			{ $limit: numberMostRecentChats },
			{
				$group: {
					_id: null,
					chats: { $sum: 1 },
					sumChatDuration: { $sum: '$metrics.chatDuration' },
				},
			},
			{ $project: { _id: '$_id', avgChatDuration: { $divide: ['$sumChatDuration', '$chats'] } } },
		];

		const [statistic] = await this.col.aggregate(aggregate, { readPreference: readSecondaryPreferred() }).toArray();
		return statistic;
	}

	findByNameContainingAndTypes(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion: boolean = false,
		teams: boolean = false,
		showOnlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const onlyTeamsQuery = showOnlyTeams ? { teamMain: { $exists: true } } : {};

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const query: Filter<IRoom> = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			$or: [
				{
					$and: [
						{
							$or: [
								{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name: nameRegex }] },
								{ federated: true, fname: nameRegex },
							],
						},
					],
				},
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
			...teamCondition,
			...onlyTeamsQuery,
		};
		return this.findPaginated(query, options);
	}

	findByTypes(
		types: Array<IRoom['t']>,
		discussion: boolean = false,
		teams: boolean = false,
		onlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { teamMain: { $exists: true } } : {};

		const query: Filter<IRoom> = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			...teamCondition,
			...onlyTeamsCondition,
		};
		return this.findPaginated(query, options);
	}

	findByNameContaining(
		name: NonNullable<IRoom['name']>,
		discussion: boolean = false,
		teams: boolean = false,
		onlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { $and: [{ teamMain: { $exists: true } }, { teamMain: true }] } : {};

		const query: Filter<IRoom> = {
			prid: { $exists: discussion },
			$or: [
				{
					$and: [
						{
							$or: [
								{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name: nameRegex }] },
								{ federated: true, fname: nameRegex },
							],
						},
					],
				},
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
			...teamCondition,
			...onlyTeamsCondition,
		};

		return this.findPaginated(query, options);
	}

	findByTeamId(teamId: ITeam['_id'], options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query: Filter<IRoom> = {
			teamId,
			teamMain: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByTeamIdContainingNameAndDefault(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean = false,
		ids: Array<IRoom['_id']> = [],
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const query: Filter<IRoom> = {
			teamId,
			teamMain: {
				$exists: false,
			},
			...(name ? { name: new RegExp(escapeRegExp(name), 'i') } : {}),
			...(teamDefault === true ? { teamDefault } : {}),
			...(ids ? { $or: [{ t: 'c' }, { _id: { $in: ids } }] } : {}),
		};

		return this.findPaginated(query, options);
	}

	findByTeamIdAndRoomsId(teamId: ITeam['_id'], rids: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query = {
			teamId,
			_id: {
				$in: rids,
			},
		};

		return this.find(query, options);
	}

	findChannelAndPrivateByNameStarting(
		name: NonNullable<IRoom['name']>,
		sIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindCursor<IRoom> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query: Filter<IRoom> = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			teamMain: {
				$exists: false,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: sIds,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findRoomsByNameOrFnameStarting(name: NonNullable<IRoom['name'] | IRoom['fname']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query: Filter<IRoom> = {
			t: {
				$in: ['c', 'p'],
			},
			$or: [
				{
					name: nameRegex,
				},
				{
					fname: nameRegex,
				},
			],
		};

		return this.find(query, options);
	}

	findRoomsWithoutDiscussionsByRoomIds(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindCursor<IRoom> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query: Filter<IRoom> = {
			_id: {
				$in: roomIds,
			},
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: roomIds,
					},
				},
			],
			prid: { $exists: false },
			$and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }],
		};

		return this.find(query, options);
	}

	findPaginatedRoomsWithoutDiscussionsByRoomIds(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query: Filter<IRoom> = {
			_id: {
				$in: roomIds,
			},
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: roomIds,
					},
				},
			],
			prid: { $exists: false },
			$and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }],
		};

		return this.findPaginated(query, options);
	}

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(
		name: NonNullable<IRoom['name']>,
		groupsToAccept: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindCursor<IRoom> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query: Filter<IRoom> = {
			teamId: {
				$exists: false,
			},
			prid: {
				$exists: false,
			},
			_id: {
				$in: groupsToAccept,
			},
			name: nameRegex,
			$and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }],
		};
		return this.find(query, options);
	}

	unsetTeamId(teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = { teamId };
		const update: UpdateFilter<IRoom> = {
			$unset: {
				teamId: '',
				teamDefault: '',
				teamMain: '',
			},
		};

		return this.updateMany(query, update, options);
	}

	unsetTeamById(rid: IRoom['_id'], options: UpdateOptions = {}): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $unset: { teamId: '', teamDefault: '' } }, options);
	}

	setTeamById(
		rid: IRoom['_id'],
		teamId: ITeam['_id'],
		teamDefault: IRoom['teamDefault'],
		options: UpdateOptions = {},
	): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamDefault } }, options);
	}

	setTeamMainById(rid: IRoom['_id'], teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamMain: true } }, options);
	}

	setTeamByIds(rids: Array<IRoom['_id']>, teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<Document | UpdateResult> {
		return this.updateMany({ _id: { $in: rids } }, { $set: { teamId } }, options);
	}

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: IRoom['teamDefault'], options: UpdateOptions = {}): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $set: { teamDefault } }, options);
	}

	findChannelsWithNumberOfMessagesBetweenDate({
		start,
		end,
		startOfLastWeek,
		endOfLastWeek,
		onlyCount = false,
		options = {},
	}: {
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		onlyCount: boolean;
		options: PaginatedRequest;
	}): AggregationCursor<IRoom> {
		const readPreference = ReadPreference.SECONDARY_PREFERRED;
		const lookup = {
			$lookup: {
				from: 'rocketchat_analytics',
				localField: '_id',
				foreignField: 'room._id',
				as: 'messages',
			},
		};
		const messagesProject = {
			$project: {
				room: '$$ROOT',
				messages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [{ $gte: ['$$message.date', start] }, { $lte: ['$$message.date', end] }],
						},
					},
				},
				lastWeekMessages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [{ $gte: ['$$message.date', startOfLastWeek] }, { $lte: ['$$message.date', endOfLastWeek] }],
						},
					},
				},
			},
		};
		const messagesUnwind = {
			$unwind: {
				path: '$messages',
				preserveNullAndEmptyArrays: true,
			},
		};
		const messagesGroup = {
			$group: {
				_id: {
					_id: '$room._id',
				},
				room: { $first: '$room' },
				messages: { $sum: '$messages.messages' },
				lastWeekMessages: { $first: '$lastWeekMessages' },
			},
		};
		const lastWeekMessagesUnwind = {
			$unwind: {
				path: '$lastWeekMessages',
				preserveNullAndEmptyArrays: true,
			},
		};
		const lastWeekMessagesGroup = {
			$group: {
				_id: {
					_id: '$room._id',
				},
				room: { $first: '$room' },
				messages: { $first: '$messages' },
				lastWeekMessages: { $sum: '$lastWeekMessages.messages' },
			},
		};
		const presentationProject = {
			$project: {
				_id: 0,
				room: {
					_id: '$_id._id',
					name: { $ifNull: ['$room.name', '$room.fname'] },
					ts: '$room.ts',
					t: '$room.t',
					_updatedAt: '$room._updatedAt',
					usernames: '$room.usernames',
				},
				messages: '$messages',
				lastWeekMessages: '$lastWeekMessages',
				diffFromLastWeek: { $subtract: ['$messages', '$lastWeekMessages'] },
			},
		};
		const firstParams = [
			lookup,
			messagesProject,
			messagesUnwind,
			messagesGroup,
			lastWeekMessagesUnwind,
			lastWeekMessagesGroup,
			presentationProject,
		];
		const sort = { $sort: options.sort || { messages: -1 } };
		const params: Exclude<Parameters<Collection<IRoom>['aggregate']>[0], undefined> = [...firstParams, sort];

		if (onlyCount) {
			params.push({ $count: 'total' });
		}

		if (options.offset) {
			params.push({ $skip: options.offset });
		}

		if (options.count) {
			params.push({ $limit: options.count });
		}

		return this.col.aggregate<IRoom>(params, { allowDiskUse: true, readPreference });
	}

	findOneByName(name: IRoom['name'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		return this.col.findOne({ name }, options);
	}

	findDefaultRoomsForTeam(teamId: ITeam['_id']): FindCursor<IRoom> {
		return this.col.find({
			teamId,
			teamDefault: true,
			teamMain: {
				$exists: false,
			},
		});
	}

	incUsersCountByIds(ids: Array<IRoom['_id']>, inc: number = 1): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			_id: {
				$in: ids,
			},
		};

		const update: UpdateFilter<IRoom> = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.updateMany(query, update);
	}

	findOneByNameOrFname(name: NonNullable<IRoom['name'] | IRoom['fname']>, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		return this.col.findOne({ $or: [{ name }, { fname: name }] }, options);
	}

	allRoomSourcesCount(): AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }> {
		return this.col.aggregate([
			{
				$match: {
					source: {
						$exists: true,
					},
					t: 'l',
				},
			},
			{
				$group: {
					_id: '$source',
					count: { $sum: 1 },
				},
			},
		]);
	}

	findByBroadcast(options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find(
			{
				broadcast: true,
			},
			options,
		);
	}

	findByActiveLivestream(options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find(
			{
				'streamingOptions.type': 'livestream',
			},
			options,
		);
	}

	setAsFederated(roomId: IRoom['_id']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { federated: true } });
	}

	setRoomTypeById(roomId: IRoom['_id'], roomType: IRoom['t']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { t: roomType } });
	}

	setRoomNameById(roomId: IRoom['_id'], name: IRoom['name']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { name } });
	}

	setFnameById(_id: IRoom['_id'], fname: IRoom['fname']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				fname,
			},
		};

		return this.updateOne(query, update);
	}

	setRoomTopicById(roomId: IRoom['_id'], topic: IRoom['description']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { description: topic } });
	}

	findByE2E(options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find(
			{
				encrypted: true,
			},
			options,
		);
	}

	findRoomsInsideTeams(autoJoin: boolean = false): FindCursor<IRoom> {
		return this.find({
			teamId: { $exists: true },
			teamMain: { $exists: false },
			...(autoJoin && { teamDefault: true }),
		});
	}

	countByType(t: IRoom['t']): Promise<number> {
		return this.col.countDocuments({ t });
	}

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm: RegExp | null,
		teamIds: Array<ITeam['_id']>,
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const query: Filter<IRoom> = {
			$and: [
				{ teamMain: { $exists: false } },
				{ prid: { $exists: false } },
				{
					$or: [
						{
							t: 'c',
							teamId: { $exists: false },
						},
						{
							t: 'c',
							teamId: { $in: teamIds },
						},
						...(roomIds?.length > 0
							? [
									{
										_id: {
											$in: roomIds,
										},
									},
							  ]
							: []),
					],
				},
				...(searchTerm
					? [
							{
								$or: [
									{
										name: searchTerm,
									},
									{
										fname: searchTerm,
									},
								],
							},
					  ]
					: []),
			],
		};

		return this.findPaginated(query, options);
	}

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(
		searchTerm: RegExp | null,
		rids: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const query: Filter<IRoom> = {
			teamMain: true,
			$and: [
				{
					$or: [
						{
							t: 'p',
							_id: {
								$in: rids,
							},
						},
						{
							t: 'c',
						},
					],
				},
			],
		};

		if (searchTerm && query.$and) {
			query.$and.push({
				$or: [
					{
						name: searchTerm,
					},
					{
						fname: searchTerm,
					},
				],
			});
		}

		return this.findPaginated(query, options);
	}

	findPaginatedByTypeAndIds(
		type: IRoom['t'],
		ids: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const query: Filter<IRoom> = {
			t: type,
			_id: {
				$in: ids,
			},
		};

		return this.findPaginated(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(
		uid: IDirectMessageRoom['uids'],
		options: FindOptions<IRoom> = {},
	): Promise<IDirectMessageRoom | null> {
		const query: Filter<IRoom> = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne<IDirectMessageRoom>(query, options);
	}

	findFederatedRooms(options: FindOptions<IRoom> = {}): FindCursor<IRoomFederated> {
		const query: Filter<IRoom> = {
			federated: true,
		};

		return this.find<IRoomFederated>(query, options);
	}

	findCountOfRoomsWithActiveCalls() {
		const query = {
			// No matter the actual "status" of the call, if the room has a callStatus, it means there is/was a call
			callStatus: { $exists: true },
		};

		return this.col.countDocuments(query);
	}
}
