import type {
	IDirectMessageRoom,
	IMessage,
	IOmnichannelGenericRoom,
	IRoom,
	IRoomFederated,
	ITeam,
	IUser,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { FindPaginated, IRoomsModel, IChannelsWithNumberOfMessagesBetweenDate } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	AggregationCursor,
	Collection,
	Db,
	DeleteResult,
	Document,
	Filter,
	FindCursor,
	FindOptions,
	IndexDescription,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	WithId,
	CountDocumentsOptions,
} from 'mongodb';

import { Subscriptions } from '../index';
import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';
import type { Updater } from '../updater';

export class RoomsRaw extends BaseRaw<IRoom> implements IRoomsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IRoom>>) {
		super(db, 'room', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [
			{
				key: { name: 1 },
				unique: true,
				sparse: true,
			},
			{
				key: { default: 1 },
				sparse: true,
			},
			{
				key: { featured: 1 },
				sparse: true,
			},
			{
				key: { muted: 1 },
				sparse: true,
			},
			{
				key: { 'u._id': 1 },
			},
			{
				key: { ts: 1 },
			},
			// discussions
			{
				key: { prid: 1 },
				sparse: true,
			},
			{
				key: { fname: 1 },
				sparse: true,
			},
			// field used for DMs only
			{
				key: { uids: 1 },
				sparse: true,
			},
			{
				key: { createdOTR: 1 },
				sparse: true,
			},
			{
				key: { encrypted: 1 },
				sparse: true,
			}, // used on statistics
			{
				key: { broadcast: 1 },
				sparse: true,
			}, // used on statistics
			{
				key: {
					teamId: 1,
					teamDefault: 1,
				},
				sparse: true,
			},
			{ key: { t: 1, ts: 1 } },
			{
				key: {
					'usersWaitingForE2EKeys.userId': 1,
				},
				partialFilterExpression: {
					'usersWaitingForE2EKeys.userId': {
						$exists: true,
					},
				},
			},
		];
	}

	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			'_id': rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findManyByRoomIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query: Filter<IRoom> = {
			_id: {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByIds(
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom & { isLastOwner?: boolean }>> {
		return this.findPaginated(
			{
				_id: { $in: roomIds },
			},
			options,
		);
	}

	async getMostRecentAverageChatDurationTime(
		numberMostRecentChats: number,
		department?: string,
	): Promise<{ props: { _id: IRoom['_id']; avgChatDuration: number } }> {
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

		const [statistic] = await this.col
			.aggregate<{ props: { _id: IRoom['_id']; avgChatDuration: number } }>(aggregate, { readPreference: readSecondaryPreferred() })
			.toArray();
		return statistic;
	}

	findByNameOrFnameContainingAndTypes(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion = false,
		teams = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>> {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const nameCondition: Filter<IRoom> = {
			$or: [
				{ name: nameRegex, federated: { $ne: true } },
				{ fname: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};

		const query: Filter<IRoom> = {
			$and: [
				name ? nameCondition : {},
				types?.length || discussion || teams
					? {
							$or: [
								{
									t: {
										$in: types,
									},
								},
								...(discussion ? [{ prid: { $exists: true } }] : []),
								...(teams ? [{ teamMain: { $exists: true } }] : []),
							],
						}
					: {},
			],
			...(!discussion ? { prid: { $exists: false } } : {}),
			...(!teams ? { teamMain: { $exists: false } } : {}),
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

	countByTeamId(teamId: ITeam['_id']): Promise<number> {
		const query: Filter<IRoom> = {
			teamId,
			teamMain: {
				$exists: false,
			},
		};

		return this.countDocuments(query);
	}

	findPaginatedByTeamIdContainingNameAndDefault(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean,
		ids: Array<IRoom['_id']> | undefined,
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
		const query: Filter<IRoom> = {
			teamId,
			_id: {
				$in: rids,
			},
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
			$and: [{ federated: { $ne: true } }, { archived: { $ne: true } }],
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

	setTeamDefaultById(
		rid: IRoom['_id'],
		teamDefault: NonNullable<IRoom['teamDefault']>,
		options: UpdateOptions = {},
	): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $set: { teamDefault } }, options);
	}

	getChannelsWithNumberOfMessagesBetweenDateQuery({
		types,
		start,
		end,
		startOfLastWeek,
		endOfLastWeek,
		options,
	}: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}) {
		const typeMatch = {
			$match: {
				t: { $in: types },
			},
		};
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
		const firstParams = [typeMatch, lookup, messagesProject, messagesUnwind, messagesGroup];
		const lastParams = [lastWeekMessagesUnwind, lastWeekMessagesGroup, presentationProject];

		const sort = { $sort: options?.sort || { messages: -1 } };
		const sortAndPaginationParams: Exclude<Parameters<Collection<IRoom>['aggregate']>[0], undefined> = [sort];

		if (options?.offset) {
			sortAndPaginationParams.push({ $skip: options.offset });
		}

		if (options?.count) {
			sortAndPaginationParams.push({ $limit: options.count });
		}
		const params: Exclude<Parameters<Collection<IRoom>['aggregate']>[0], undefined> = [...firstParams];

		if (options?.sort) {
			params.push(...lastParams, ...sortAndPaginationParams);
		} else {
			params.push(...sortAndPaginationParams, ...lastParams, sort);
		}

		return params;
	}

	findChannelsByTypesWithNumberOfMessagesBetweenDate(params: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}): AggregationCursor<IChannelsWithNumberOfMessagesBetweenDate> {
		const aggregationParams = this.getChannelsWithNumberOfMessagesBetweenDateQuery(params);
		return this.col.aggregate<IChannelsWithNumberOfMessagesBetweenDate>(aggregationParams, {
			allowDiskUse: true,
			readPreference: readSecondaryPreferred(),
		});
	}

	findOneByNameOrFname(name: NonNullable<IRoom['name'] | IRoom['fname']>, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query = {
			$or: [
				{
					name,
				},
				{
					fname: name,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByJoinCodeAndId(joinCode: string, rid: IRoom['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			_id: rid,
			joinCode,
		};

		return this.findOne(query, options);
	}

	async findOneByNonValidatedName(name: NonNullable<IRoom['name'] | IRoom['fname']>, options: FindOptions<IRoom> = {}) {
		const room = await this.findOneByNameOrFname(name, options);
		if (room) {
			return room;
		}

		return this.findOneByName(name, options);
	}

	findOneByName(name: NonNullable<IRoom['name']>, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
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

	incUsersCountByIds(ids: Array<IRoom['_id']>, inc = 1, options?: UpdateOptions): Promise<Document | UpdateResult> {
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

		return this.updateMany(query, update, options);
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

	countByBroadcast(options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments(
			{
				broadcast: true,
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

	setSidepanelById(roomId: IRoom['_id'], sidepanel: IRoom['sidepanel']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { sidepanel } });
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

	countByE2E(options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments(
			{
				encrypted: true,
			},
			options,
		);
	}

	findE2ERoomById(roomId: IRoom['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		return this.findOne(
			{
				_id: roomId,
				encrypted: true,
			},
			options,
		);
	}

	findRoomsInsideTeams(autoJoin = false): FindCursor<IRoom> {
		return this.find({
			teamId: { $exists: true },
			teamMain: { $exists: false },
			...(autoJoin && { teamDefault: true }),
		});
	}

	countRoomsInsideTeams(autoJoin = false): Promise<number> {
		return this.countDocuments({
			teamId: { $exists: true },
			teamMain: { $exists: false },
			...(autoJoin && { teamDefault: true }),
		});
	}

	countByType(t: IRoom['t']): Promise<number> {
		return this.countDocuments({ t });
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

	findOneDirectRoomContainingAllUserIDs(uid: IDirectMessageRoom['uids'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne<IRoom>(query, options);
	}

	findFederatedRooms(options: FindOptions<IRoom> = {}): FindCursor<IRoomFederated> {
		const query: Filter<IRoom> = {
			federated: true,
		};

		return this.find<IRoomFederated>(query, options);
	}

	findCountOfRoomsWithActiveCalls(): Promise<number> {
		const query: Filter<IRoom> = {
			// No matter the actual "status" of the call, if the room has a callStatus, it means there is/was a call
			callStatus: { $exists: true },
		};

		return this.countDocuments(query);
	}

	async findBiggestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined> {
		const asc = false;

		return this.findFederatedRoomByAmountOfUsers(options, asc);
	}

	async findFederatedRoomByAmountOfUsers(options?: FindOptions<IRoom>, asc = true): Promise<IRoom | undefined> {
		const query = {
			federated: true,
		};

		const room = await (
			await this.find(query, options)
				.sort({ usersCount: asc ? 1 : -1 })
				.limit(1)
				.toArray()
		).shift();

		return room;
	}

	async findSmallestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined> {
		const asc = true;

		return this.findFederatedRoomByAmountOfUsers(options, asc);
	}

	async countFederatedRooms(): Promise<number> {
		return this.countDocuments({ federated: true });
	}

	incMsgCountById(_id: IRoom['_id'], inc = 1): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$inc: {
				msgs: inc,
			},
		};

		return this.updateOne(query, update);
	}

	getIncMsgCountUpdateQuery(inc: number, roomUpdater: Updater<IRoom>): Updater<IRoom> {
		return roomUpdater.inc('msgs', inc);
	}

	decreaseMessageCountById(_id: IRoom['_id'], count = 1) {
		return this.incMsgCountById(_id, -count);
	}

	findOneByIdOrName(_idOrName: IRoom['_id'] | IRoom['name'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneByIdAndType(roomId: IRoom['_id'], type: IRoom['t'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		return this.findOne({ _id: roomId, t: type }, options);
	}

	setCallStatus(_id: IRoom['_id'], status: IRoom['callStatus']): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};

		const update: UpdateFilter<IRoom> = {
			$set: {
				callStatus: status,
			},
		};

		return this.updateOne(query, update);
	}

	setCallStatusAndCallStartTime(_id: IRoom['_id'], status: IRoom['callStatus']): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};

		const update: UpdateFilter<IRoom> = {
			$set: {
				callStatus: status,
				webRtcCallStartTime: new Date(),
			},
		};

		return this.updateOne(query, update);
	}

	setReactionsInLastMessage(roomId: IRoom['_id'], reactions: IMessage['reactions']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { 'lastMessage.reactions': reactions } });
	}

	unsetReactionsInLastMessage(roomId: IRoom['_id']): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $unset: { 'lastMessage.reactions': 1 } });
	}

	unsetAllImportIds(): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			importIds: {
				$exists: true,
			},
		};

		const update: UpdateFilter<IRoom> = {
			$unset: {
				importIds: 1,
			},
		};

		return this.updateMany(query, update);
	}

	updateLastMessageStar(roomId: IRoom['_id'], userId: IUser['_id'], starred: boolean): Promise<UpdateResult> {
		let update: UpdateFilter<IRoom>;
		const query: Filter<IRoom> = { _id: roomId };

		if (starred) {
			update = {
				$addToSet: {
					'lastMessage.starred': { _id: userId },
				},
			};
		} else {
			update = {
				$pull: {
					'lastMessage.starred': { _id: userId },
				},
			};
		}

		return this.updateOne(query, update);
	}

	setLastMessagePinned(
		roomId: IRoom['_id'],
		pinnedBy: IMessage['pinnedBy'],
		pinned: IMessage['pinned'],
		pinnedAt: IMessage['pinnedAt'],
	): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: roomId };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'lastMessage.pinned': pinned,
				'lastMessage.pinnedAt': pinnedAt || new Date(),
				'lastMessage.pinnedBy': pinnedBy,
			},
		};

		return this.updateOne(query, update);
	}

	setLastMessageAsRead(roomId: IRoom['_id']): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: {
					'lastMessage.unread': 1,
				},
			},
		);
	}

	setDescriptionById(_id: IRoom['_id'], description: IRoom['description']): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};
		const update: UpdateFilter<IRoom> = {
			$set: {
				description,
			},
		};
		return this.updateOne(query, update);
	}

	setReadOnlyById(_id: IRoom['_id'], readOnly: NonNullable<IRoom['ro']>): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};
		const update: UpdateFilter<IRoom> = {
			$set: {
				ro: readOnly,
			},
		};

		return this.updateOne(query, update);
	}

	setDmReadOnlyByUserId(
		_id: IRoom['_id'],
		ids: Array<IRoom['_id']>,
		readOnly: NonNullable<IRoom['ro']>,
		reactWhenReadOnly: NonNullable<IRoom['reactWhenReadOnly']>,
	): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			uids: {
				$size: 2,
				$in: [_id],
			},
			...(ids && Array.isArray(ids) ? { _id: { $in: ids } } : {}),
			t: 'd',
		};

		const update: UpdateFilter<IRoom> = {
			$set: {
				ro: readOnly,
				reactWhenReadOnly,
			},
		};

		return this.updateMany(query, update);
	}

	getDirectConversationsByUserId(_id: IRoom['_id'], options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find({ t: 'd', uids: { $size: 2, $in: [_id] } }, options);
	}

	// 2
	setAllowReactingWhenReadOnlyById(_id: IRoom['_id'], allowReacting: NonNullable<IRoom['reactWhenReadOnly']>): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};
		const update: UpdateFilter<IRoom> = {
			$set: {
				reactWhenReadOnly: allowReacting,
			},
		};
		return this.updateOne(query, update);
	}

	setAvatarData(_id: IRoom['_id'], origin: string, etag: IRoom['avatarETag']): Promise<UpdateResult> {
		const update: UpdateFilter<IRoom> = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetAvatarData(_id: IRoom['_id']): Promise<UpdateResult> {
		const update: UpdateFilter<IRoom> = {
			$set: {
				avatarETag: Date.now().toString(),
			},
			$unset: {
				avatarOrigin: 1,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setSystemMessagesById(_id: IRoom['_id'], systemMessages: IRoom['sysMes']): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};
		const update: UpdateFilter<IRoom> =
			Array.isArray(systemMessages) && systemMessages.length > 0
				? {
						$set: {
							sysMes: systemMessages,
						},
					}
				: {
						$unset: {
							sysMes: '',
						},
					};

		return this.updateOne(query, update);
	}

	setE2eKeyId(_id: IRoom['_id'], e2eKeyId: IRoom['e2eKeyId'], options: UpdateOptions = {}): Promise<UpdateResult> {
		const query: Filter<IRoom> = {
			_id,
		};

		const update: UpdateFilter<IRoom> = {
			$set: {
				e2eKeyId,
			},
		};

		return this.updateOne(query, update, options);
	}

	findOneByImportId(_id: IRoom['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name: NonNullable<IRoom['name']>, rid: IRoom['_id']): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname: IRoom['fname'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = { fname };

		return this.findOne(query, options);
	}

	findOneByNameAndType(
		name: NonNullable<IRoom['name']>,
		type: IRoom['t'],
		options: FindOptions<IRoom> = {},
		includeFederatedRooms = false,
	): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			t: type,
			teamId: {
				$exists: false,
			},
			...(includeFederatedRooms
				? { $or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }] }
				: { $or: [{ federated: { $exists: false } }, { federated: false }], name }),
		};

		return this.findOne(query, options);
	}

	// FIND
	findById(roomId: IRoom['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		return this.findOne({ _id: roomId }, options);
	}

	findByIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find({ _id: { $in: roomIds } }, options);
	}

	findByType(type: IRoom['t'], options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query: Filter<IRoom> = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type: IRoom['t'], ids: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query: Filter<IRoom> = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	async findBySubscriptionUserId(userId: IUser['_id'], options: FindOptions<IRoom> = {}): Promise<FindCursor<IRoom>> {
		const data = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((item) => item.rid);

		const query: Filter<IRoom> = {
			_id: {
				$in: data,
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
						$in: data,
					},
				},
			],
		};

		return this.find(query, options);
	}

	async findBySubscriptionUserIdUpdatedAfter(
		userId: IUser['_id'],
		_updatedAt: IRoom['_updatedAt'],
		options: FindOptions<IRoom> = {},
	): Promise<FindCursor<IRoom>> {
		const ids = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((item) => item.rid);

		const query: Filter<IRoom> = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
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
						$in: ids,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findByNameAndTypeNotDefault(
		name: IRoom['name'] | RegExp,
		type: IRoom['t'],
		options: FindOptions<IRoom> = {},
		includeFederatedRooms = false,
	): FindCursor<IRoom> {
		const query: Filter<IRoom> = {
			t: type,
			default: {
				$ne: true,
			},
			$and: [
				{
					$or: [
						{
							teamId: {
								$exists: false,
							},
						},
						{
							teamMain: true,
						},
					],
				},
				includeFederatedRooms
					? {
							$or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }],
						}
					: { $or: [{ federated: { $exists: false } }, { federated: false }], name },
			],
		};

		// do not use cache
		return this.find(query, options);
	}

	// 3
	findByNameOrFNameAndTypesNotInIds(
		name: IRoom['name'] | RegExp,
		types: Array<IRoom['t']>,
		ids: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
		includeFederatedRooms = false,
	): FindCursor<IRoom> {
		const nameCondition: Filter<IRoom> = {
			$or: [{ name }, { fname: name }],
		};
		const query: Filter<IRoom> = {
			_id: {
				$nin: ids,
			},
			t: {
				$in: types,
			},
			$and: [
				{
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
								$in: ids,
							},
						},
						{
							// Also return the main room of public teams
							// this will have no effect if the method is called without the 'c' type, as the type filter is outside the $or group.
							teamMain: true,
							t: 'c',
						},
					],
				},
				includeFederatedRooms
					? {
							$or: [
								{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }, nameCondition] },
								{ federated: true, fname: name },
							],
						}
					: { $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }, nameCondition] },
			],
		};

		// do not use cache
		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue: boolean, types: Array<IRoom['t']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const query: Filter<IRoom> = {
			t: {
				$in: types,
			},
			...(defaultValue ? { default: true } : { default: { $ne: true } }),
		};

		return this.find(query, options);
	}

	findDirectRoomContainingAllUsernames(
		usernames: NonNullable<IRoom['usernames']>,
		options: FindOptions<IRoom> = {},
	): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			t: 'd',
			usernames: { $size: usernames.length, $all: usernames },
			usersCount: usernames.length,
		};

		return this.findOne(query, options);
	}

	findByTypeAndName(type: IRoom['t'], name: NonNullable<IRoom['name']>, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameOrId(
		type: IRoom['t'],
		identifier: NonNullable<IRoom['name'] | IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): Promise<IRoom | null> {
		const query: Filter<IRoom> = {
			t: type,
			$or: [{ name: identifier }, { _id: identifier }],
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameContaining(type: IRoom['t'], name: NonNullable<IRoom['name']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const query: Filter<IRoom> = {
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeInIdsAndNameContaining(
		type: IRoom['t'],
		ids: Array<IRoom['_id']>,
		name: NonNullable<IRoom['name']>,
		options: FindOptions<IRoom> = {},
	): FindCursor<IRoom> {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const query: Filter<IRoom> = {
			_id: {
				$in: ids,
			},
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findGroupDMsByUids(uids: NonNullable<IRoom['uids']>, options: FindOptions<IDirectMessageRoom> = {}): FindCursor<IDirectMessageRoom> {
		return this.find(
			{
				usersCount: { $gt: 2 },
				uids: { $in: uids },
			},
			options,
		);
	}

	countGroupDMsByUids(uids: NonNullable<IRoom['uids']>): Promise<number> {
		return this.countDocuments({
			usersCount: { $gt: 2 },
			uids: { $in: uids },
		});
	}

	find1On1ByUserId(userId: IRoom['_id'], options: FindOptions<IRoom> = {}): FindCursor<IRoom> {
		return this.find(
			{
				uids: userId,
				usersCount: 2,
			},
			options,
		);
	}

	findByCreatedOTR(): FindCursor<IRoom> {
		return this.find({ createdOTR: true });
	}

	countByCreatedOTR(options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments({ createdOTR: true }, options);
	}

	findByUsernamesOrUids(uids: IRoom['u']['_id'][], usernames: IRoom['u']['username'][]): FindCursor<IRoom> {
		return this.find({ $or: [{ usernames: { $in: usernames } }, { uids: { $in: uids } }] });
	}

	findDMsByUids(uids: IRoom['u']['_id'][]): FindCursor<IRoom> {
		return this.find({ uids: { $size: 2, $in: [uids] }, t: 'd' });
	}

	// UPDATE
	addImportIds(_id: IRoom['_id'], importIds: string[]): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$addToSet: {
				importIds: {
					$each: ([] as string[]).concat(importIds),
				},
			},
		};

		return this.updateOne(query, update);
	}

	archiveById(_id: IRoom['_id']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				archived: true,
			},
		};

		return this.updateOne(query, update);
	}

	unarchiveById(_id: IRoom['_id']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				archived: false,
			},
		};

		return this.updateOne(query, update);
	}

	setNameById(_id: IRoom['_id'], name: IRoom['name'], fname: IRoom['fname']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				name,
				fname,
			},
		};

		return this.updateOne(query, update);
	}

	setIncMsgCountAndSetLastMessageUpdateQuery(
		inc: number,
		lastMessage: IMessage,
		shouldStoreLastMessage: boolean,
		roomUpdater: Updater<IRoom>,
	): Updater<IRoom> {
		roomUpdater.inc('msgs', inc).set('lm', lastMessage.ts);

		if (shouldStoreLastMessage) {
			roomUpdater.set('lastMessage', lastMessage);
		}

		return roomUpdater;
	}

	incUsersCountById(_id: IRoom['_id'], inc = 1): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.updateOne(query, update);
	}

	// 4
	incUsersCountNotDMsByIds(ids: Array<IRoom['_id']>, inc = 1): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			_id: {
				$in: ids,
			},
			t: { $ne: 'd' },
		};

		const update: UpdateFilter<IRoom> = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.updateMany(query, update);
	}

	getLastMessageUpdateQuery(lastMessage: IRoom['lastMessage'], roomUpdater: Updater<IRoom>): Updater<IRoom> {
		return roomUpdater.set('lastMessage', lastMessage);
	}

	async resetLastMessageById(_id: IRoom['_id'], lastMessage: IRoom['lastMessage'] | null, msgCountDelta?: number): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update = {
			...(lastMessage ? { $set: { lastMessage } } : { $unset: { lastMessage: 1 as const } }),
			...(msgCountDelta ? { $inc: { msgs: msgCountDelta } } : {}),
		};

		return this.updateOne(query, update);
	}

	replaceUsername(previousUsername: IUser['username'], username: IUser['username']): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = { usernames: previousUsername };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'usernames.$': username,
			},
		};

		return this.updateMany(query, update);
	}

	replaceMutedUsername(previousUsername: IUser['username'], username: IUser['username']): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = { muted: previousUsername };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'muted.$': username,
			},
		};

		return this.updateMany(query, update);
	}

	replaceUsernameOfUserByUserId(userId: IUser['_id'], username: IUser['username']): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = { 'u._id': userId };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'u.username': username,
			},
		};

		return this.updateMany(query, update);
	}

	setJoinCodeById(_id: IRoom['_id'], joinCode: string): Promise<UpdateResult> {
		let update: UpdateFilter<IRoom>;
		const query: Filter<IRoom> = { _id };

		if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode,
				},
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false,
				},
				$unset: {
					joinCode: 1,
				},
			};
		}

		return this.updateOne(query, update);
	}

	setTypeById(_id: IRoom['_id'], type: IRoom['t']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };
		const update: UpdateFilter<IRoom> = {
			$set: {
				t: type,
			},
		};
		if (type === 'p') {
			update.$unset = { default: '' };
		}

		return this.updateOne(query, update);
	}

	setTopicById(_id: IRoom['_id'], topic: IRoom['topic']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				topic,
			},
		};

		return this.updateOne(query, update);
	}

	setAnnouncementById(
		_id: IRoom['_id'],
		announcement: IRoom['announcement'],
		announcementDetails: IRoom['announcementDetails'],
	): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				announcement,
				announcementDetails,
			},
		};

		return this.updateOne(query, update);
	}

	setCustomFieldsById(_id: IRoom['_id'], customFields: IRoom['customFields']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				customFields,
			},
		};

		return this.updateOne(query, update);
	}

	muteUsernameByRoomId(_id: IRoom['_id'], username: IUser['username']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$addToSet: {
				muted: username,
			},
			$pull: {
				unmuted: username,
			},
		};

		return this.updateOne(query, update);
	}

	muteReadOnlyUsernameByRoomId(_id: IRoom['_id'], username: IUser['username']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id, ro: true };

		const update: UpdateFilter<IRoom> = {
			$pull: {
				unmuted: username,
			},
		};

		return this.updateOne(query, update);
	}

	unmuteMutedUsernameByRoomId(_id: IRoom['_id'], username: IUser['username']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$pull: {
				muted: username,
			},
		};

		return this.updateOne(query, update);
	}

	unmuteReadOnlyUsernameByRoomId(_id: string, username: string): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id, ro: true };

		const update: UpdateFilter<IRoom> = {
			$pull: {
				muted: username,
			},
			$addToSet: {
				unmuted: username,
			},
		};

		return this.updateOne(query, update);
	}

	saveFeaturedById(_id: IRoom['_id'], featured: string | boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };
		const set = ['true', true].includes(featured);

		const update: UpdateFilter<IRoom> = {
			[set ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.updateOne(query, update);
	}

	saveDefaultById(_id: IRoom['_id'], defaultValue: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				default: defaultValue,
			},
		};

		return this.updateOne(query, update);
	}

	saveFavoriteById(_id: IRoom['_id'], favorite: IRoom['favorite'], defaultValue: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			...(favorite && defaultValue && { $set: { favorite } }),
			...((!favorite || !defaultValue) && { $unset: { favorite: 1 } }),
		};

		return this.updateOne(query, update);
	}

	saveRetentionEnabledById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {};

		if (value == null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.updateOne(query, update);
	}

	saveRetentionMaxAgeById(_id: IRoom['_id'], value = 30): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionExcludePinnedById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionIgnoreThreadsById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.ignoreThreads': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionFilesOnlyById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionOverrideGlobalById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveEncryptedById(_id: IRoom['_id'], value: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id };

		const update: UpdateFilter<IRoom> = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.updateOne(query, update);
	}

	updateGroupDMsRemovingUsernamesByUsername(username: string, userId: string): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			t: 'd',
			usernames: username,
			usersCount: { $gt: 2 },
		};

		const update: UpdateFilter<IRoom> = {
			$pull: {
				usernames: username,
				uids: userId,
			},
		};

		return this.updateMany(query, update);
	}

	async createWithIdTypeAndName(
		_id: IRoom['_id'],
		type: IRoom['t'],
		name: IRoom['name'],
		extraData?: Record<string, string>,
	): Promise<IRoom> {
		const room: IRoom = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0,
			usersCount: 0,
			_updatedAt: new Date(),
			u: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			},
		};

		Object.assign(room, extraData);

		await this.insertOne(room);
		return room;
	}

	async createWithFullRoomData(room: Omit<IRoom, '_id' | '_updatedAt'>): Promise<IRoom> {
		const newRoom: IRoom = {
			_id: (await this.insertOne(room)).insertedId,
			_updatedAt: new Date(),
			...room,
		};

		return newRoom;
	}

	// REMOVE
	removeById(_id: IRoom['_id']): Promise<DeleteResult> {
		const query: Filter<IRoom> = { _id };

		return this.deleteOne(query);
	}

	removeByIds(ids: Array<IRoom['_id']>): Promise<DeleteResult> {
		return this.deleteMany({ _id: { $in: ids } });
	}

	removeDirectRoomContainingUsername(username: string): Promise<DeleteResult> {
		const query: Filter<IRoom> = {
			t: 'd',
			usernames: username,
			usersCount: { $lte: 2 },
		};

		return this.deleteMany(query);
	}

	countDiscussions(): Promise<number> {
		return this.countDocuments({ prid: { $exists: true } });
	}

	setOTRForDMByRoomID(rid: IRoom['_id']): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid, t: 'd' };

		const update: UpdateFilter<IRoom> = {
			$set: {
				createdOTR: true,
			},
		};

		return this.updateOne(query, update);
	}

	async getSubscribedRoomIdsWithoutE2EKeys(uid: IUser['_id']): Promise<IRoom['_id'][]> {
		return (
			await this.col
				.aggregate([
					{ $match: { encrypted: true } },
					{
						$lookup: {
							from: 'rocketchat_subscription',
							localField: '_id',
							foreignField: 'rid',
							as: 'subs',
						},
					},
					{
						$unwind: '$subs',
					},
					{
						$match: {
							'subs.u._id': uid,
							'subs.E2EKey': {
								$exists: false,
							},
						},
					},
					{
						$project: {
							_id: 1,
						},
					},
				])
				.toArray()
		).map(({ _id }) => _id);
	}

	addUserIdToE2EEQueueByRoomIds(roomIds: IRoom['_id'][], uid: IUser['_id']): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			'_id': {
				$in: roomIds,
			},
			'usersWaitingForE2EKeys.userId': { $ne: uid },
			'encrypted': true,
		};

		const update: UpdateFilter<IRoom> = {
			$push: {
				usersWaitingForE2EKeys: {
					$each: [
						{
							userId: uid,
							ts: new Date(),
						},
					],
					$slice: -50,
				},
			},
		};

		return this.updateMany(query, update);
	}

	async removeUsersFromE2EEQueueByRoomId(roomId: IRoom['_id'], uids: IUser['_id'][]): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			'_id': roomId,
			'usersWaitingForE2EKeys.userId': {
				$in: uids,
			},
			'encrypted': true,
		};

		const update: UpdateFilter<IRoom> = {
			$pull: {
				usersWaitingForE2EKeys: { userId: { $in: uids } },
			},
		};

		await this.updateMany(query, update);

		return this.updateMany(
			{
				'_id': roomId,
				'usersWaitingForE2EKeys.0': { $exists: false },
				'encrypted': true,
			},
			{ $unset: { usersWaitingForE2EKeys: 1 } },
		);
	}

	async removeUserFromE2EEQueue(uid: IUser['_id']): Promise<Document | UpdateResult> {
		const query: Filter<IRoom> = {
			'usersWaitingForE2EKeys.userId': uid,
			'encrypted': true,
		};

		const update: UpdateFilter<IRoom> = {
			$pull: {
				usersWaitingForE2EKeys: { userId: uid },
			},
		};

		return this.updateMany(query, update);
	}

	findChildrenOfTeam(
		teamId: string,
		teamRoomId: string,
		userId: string,
		filter?: string,
		type?: 'channels' | 'discussions',
		options?: FindOptions<IRoom>,
	): AggregationCursor<{ totalCount: { count: number }[]; paginatedResults: IRoom[] }> {
		const nameFilter = filter ? new RegExp(escapeRegExp(filter), 'i') : undefined;
		return this.col.aggregate<{ totalCount: { count: number }[]; paginatedResults: IRoom[] }>([
			{
				$match: {
					$and: [
						{
							$or: [
								...(!type || type === 'channels' ? [{ teamId }] : []),
								...(!type || type === 'discussions' ? [{ prid: teamRoomId }] : []),
							],
						},
						...(nameFilter ? [{ $or: [{ fname: nameFilter }, { name: nameFilter }] }] : []),
					],
				},
			},
			{
				$lookup: {
					from: 'rocketchat_subscription',
					let: {
						roomId: '$_id',
					},
					pipeline: [
						{
							$match: {
								$and: [
									{
										$expr: {
											$eq: ['$rid', '$$roomId'],
										},
									},
									{
										$expr: {
											$eq: ['$u._id', userId],
										},
									},
									{
										$expr: {
											$ne: ['$t', 'c'],
										},
									},
								],
							},
						},
						{
							$project: { _id: 1 },
						},
					],
					as: 'subscription',
				},
			},
			{
				$match: {
					$or: [
						{ t: 'c' },
						{
							$expr: {
								$ne: [{ $size: '$subscription' }, 0],
							},
						},
					],
				},
			},
			{ $project: { subscription: 0 } },
			{ $sort: options?.sort || { ts: 1 } },
			{
				$facet: {
					totalCount: [{ $count: 'count' }],
					paginatedResults: [{ $skip: options?.skip || 0 }, { $limit: options?.limit || 50 }],
				},
			},
		]);
	}

	resetRoomKeyAndSetE2EEQueueByRoomId(
		roomId: string,
		e2eKeyId: string,
		e2eQueue?: IRoom['usersWaitingForE2EKeys'],
	): Promise<null | WithId<IRoom>> {
		return this.findOneAndUpdate(
			{ _id: roomId },
			{ $set: { e2eKeyId, ...(Array.isArray(e2eQueue) && { usersWaitingForE2EKeys: e2eQueue }) } },
			{ returnDocument: 'after' },
		);
	}

	markRolePrioritesCreatedForRoom(rid: IRoom['_id'], version: number): Promise<UpdateResult> {
		return this.updateOne({ _id: rid }, { $set: { rolePrioritiesCreated: version } });
	}

	async hasCreatedRolePrioritiesForRoom(rid: IRoom['_id'], syncVersion: number) {
		return this.countDocuments({ _id: rid, rolePrioritiesCreated: syncVersion });
	}
}
