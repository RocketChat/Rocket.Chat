import type { Collection, Db, Filter, FindOneOptions, FindOptions, UpdateFilter, UpdateResult } from 'mongodb';
import { ReadPreference } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IRoomsModel } from '@rocket.chat/model-typings';
import type { IRoom, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw<any> implements IRoomsModel {
	constructor(db: Db, trash: Collection<RocketChatRecordDeleted<IRoom>> | undefined) {
		super(db, 'room', trash);
	}

	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options: FindOneOptions<IRoom> = {}) {
		const query: Filter<IRoom> = {
			'_id': rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findManyByRoomIds(rids: IRoom['_id'][], options: FindOptions<IRoom> = {}) {
		const query: Filter<IRoom> = {
			_id: {
				$in: rids,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByIds(rids: IRoom['_id'][], options?: FindOptions<IRoom>) {
		return this.findPaginated(
			{
				_id: { $in: rids },
			},
			options,
		);
	}

	async getMostRecentAverageChatDurationTime(numberMostRecentChats: any, department: any) {
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

		const [statistic] = await this.col.aggregate(aggregate).toArray();
		return statistic;
	}

	findByNameContainingAndTypes(name: string, types: any, discussion = false, teams = false, showOnlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const onlyTeamsQuery = showOnlyTeams ? { teamMain: { $exists: true } } : {};

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
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

	findByTypes(types: any, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { teamMain: { $exists: true } } : {};

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			...teamCondition,
			...onlyTeamsCondition,
		};
		return this.findPaginated(query, options);
	}

	findByNameContaining(name: string, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const teamCondition = teams
			? {}
			: {
					teamMain: {
						$exists: false,
					},
			  };

		const onlyTeamsCondition = onlyTeams ? { $and: [{ teamMain: { $exists: true } }, { teamMain: true }] } : {};

		const query = {
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
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

	findByTeamId(teamId: any, options = {}) {
		const query = {
			teamId,
			teamMain: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByTeamIdContainingNameAndDefault(teamId: any, name: string, teamDefault: boolean, ids: any, options = {}) {
		const query = {
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

	findByTeamIdAndRoomsId(teamId: any, rids: any, options = {}) {
		const query = {
			teamId,
			_id: {
				$in: rids,
			},
		};

		return this.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name: string, sIds: any, options: FindOptions<any> | undefined) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
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

	findRoomsByNameOrFnameStarting(name: string, options: FindOptions<any> | undefined) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
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

	findRoomsWithoutDiscussionsByRoomIds(name: string, rids: IRoom['_id'][], options: FindOptions<any> | undefined) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			_id: {
				$in: rids,
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
						$in: rids,
					},
				},
			],
			prid: { $exists: false },
		};

		return this.find(query, options);
	}

	findPaginatedRoomsWithoutDiscussionsByRoomIds(name: string, rids: IRoom['_id'][], options: FindOptions<any> | undefined) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
			_id: {
				$in: rids,
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
						$in: rids,
					},
				},
			],
			prid: { $exists: false },
		};

		return this.findPaginated(query, options);
	}

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(
		_uid: IUser['_id'],
		name: string,
		groupsToAccept: any,
		options: FindOptions<any> | undefined,
	) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
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
		};
		return this.find(query, options);
	}

	unsetTeamId(teamId: any, options = {}) {
		const query = { teamId };
		const update = {
			$unset: {
				teamId: '',
				teamDefault: '',
				teamMain: '',
			},
		};

		return this.updateMany(query, update, options);
	}

	unsetTeamById(rid: IRoom['_id'], options = {}) {
		return this.updateOne({ _id: rid }, { $unset: { teamId: '', teamDefault: '' } }, options);
	}

	setTeamById(rid: IRoom['_id'], teamId: any, teamDefault: any, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamDefault } }, options);
	}

	setTeamMainById(rid: IRoom['_id'], teamId: any, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamMain: true } }, options);
	}

	setTeamByIds(rids: any, teamId: any, options = {}) {
		return this.updateMany({ _id: { $in: rids } }, { $set: { teamId } }, options);
	}

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: any, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamDefault } }, options);
	}

	setJoinCodeById(rid: IRoom['_id'], joinCode: string | null) {
		let update;
		const query = { _id: rid };

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

	saveDefaultById(_id: any, defaultValue: any) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue,
			},
		};

		return this.updateOne(query, update);
	}

	findChannelsWithNumberOfMessagesBetweenDate({
		start,
		end,
		startOfLastWeek,
		endOfLastWeek,
		onlyCount = false,
		options = {},
	}: {
		start: any;
		end: any;
		startOfLastWeek: any;
		endOfLastWeek: any;
		onlyCount?: boolean;
		options?: any;
	}) {
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
		const params: any[] = [...firstParams, sort];

		if (onlyCount) {
			params.push({ $count: 'total' });
		}

		if (options.offset) {
			params.push({ $skip: options.offset });
		}

		if (options.count) {
			params.push({ $limit: options.count });
		}

		return this.col.aggregate(params, { allowDiskUse: true, readPreference });
	}

	findOneByName(name: any, options = {}) {
		return this.col.findOne({ name }, options);
	}

	findDefaultRoomsForTeam(teamId: any) {
		return this.col.find({
			teamId,
			teamDefault: true,
			teamMain: {
				$exists: false,
			},
		});
	}

	incUsersCountByIds(ids: any, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	findOneByNameOrFname(name: any, options = {}) {
		return this.col.findOne({ $or: [{ name }, { fname: name }] }, options);
	}

	allRoomSourcesCount() {
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

	findByBroadcast(options: FindOptions<any> | undefined) {
		return this.find(
			{
				broadcast: true,
			},
			options,
		);
	}

	findByActiveLivestream(options: FindOptions<any> | undefined) {
		return this.find(
			{
				'streamingOptions.type': 'livestream',
			},
			options,
		);
	}

	setAsFederated(roomId: any) {
		return this.updateOne({ _id: roomId }, { $set: { federated: true } });
	}

	setRoomTypeById(roomId: any, roomType: any) {
		return this.updateOne({ _id: roomId }, { $set: { t: roomType } });
	}

	setRoomNameById(roomId: any, name: any, fname: any) {
		return this.updateOne({ _id: roomId }, { $set: { name, fname } });
	}

	setRoomTopicById(roomId: any, topic: any) {
		return this.updateOne({ _id: roomId }, { $set: { description: topic } });
	}

	findByE2E(options: FindOptions<any> | undefined) {
		return this.find(
			{
				encrypted: true,
			},
			options,
		);
	}

	findRoomsInsideTeams(autoJoin = false) {
		return this.find({
			teamId: { $exists: true },
			teamMain: { $exists: false },
			...(autoJoin && { teamDefault: true }),
		});
	}

	countByType(t: any) {
		return this.col.countDocuments({ t });
	}

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm: any,
		teamIds: any,
		roomIds: string | any[],
		options: FindOptions<any> | undefined,
	) {
		const query = {
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

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(searchTerm: any, rids: any, options: FindOptions<any> | undefined) {
		const query: Filter<any> = {
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

		if (searchTerm) {
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

	findPaginatedByTypeAndIds(type: any, ids: any, options: FindOptions<any> | undefined) {
		const query = {
			t: type,
			_id: {
				$in: ids,
			},
		};

		return this.findPaginated(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(uid: string | any[], options: undefined) {
		const query = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne(query, options);
	}

	findFederatedRooms(options: FindOptions<any> | undefined) {
		const query = {
			federated: true,
		};

		return this.find(query, options);
	}

	saveFeaturedById(rid: IRoom['_id'], featured: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[featured ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionEnabledById(rid: IRoom['_id'], enabled: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[enabled ? '$set' : '$unset']: {
				'retention.enabled': true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionMaxAgeById(rid: IRoom['_id'], maxAge: number): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			$set: {
				'retention.maxAge': maxAge || 30,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionExcludePinnedById(rid: IRoom['_id'], excludePinned: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[excludePinned ? '$set' : '$unset']: {
				'retention.excludePinned': true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionFilesOnlyById(rid: IRoom['_id'], filesOnly: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[filesOnly ? '$set' : '$unset']: {
				'retention.filesOnly': true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionIgnoreThreadsById(rid: IRoom['_id'], ignoreThreads: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[ignoreThreads ? '$set' : '$unset']: {
				'retention.ignoreThreads': true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionOverrideGlobalById(rid: IRoom['_id'], overrideGlobal: boolean): Promise<UpdateResult> {
		const query: Filter<IRoom> = { _id: rid };

		const update: UpdateFilter<IRoom> = {
			[overrideGlobal ? '$set' : '$unset']: {
				'retention.overrideGlobal': true,
			},
		};

		return this.updateOne(query, update);
	}
}
