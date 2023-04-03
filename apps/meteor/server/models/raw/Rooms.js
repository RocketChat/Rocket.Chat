import { ReadPreference } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Subscriptions } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';

export class RoomsRaw extends BaseRaw {
	constructor(db, trash) {
		super(db, 'room', trash);
	}

	modelIndexes() {
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
				key: { t: 1 },
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
		];
	}

	findOneByRoomIdAndUserId(rid, uid, options = {}) {
		const query = {
			'_id': rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findManyByRoomIds(roomIds, options = {}) {
		const query = {
			_id: {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByIds(roomIds, options) {
		return this.findPaginated(
			{
				_id: { $in: roomIds },
			},
			options,
		);
	}

	async getMostRecentAverageChatDurationTime(numberMostRecentChats, department) {
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

	findByNameOrFnameContainingAndTypes(name, types, discussion = false, teams = false, showOnlyTeams = false, options = {}) {
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
				{ name: nameRegex, federated: { $ne: true } },
				{ fname: nameRegex },
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

	findByTypes(types, discussion = false, teams = false, onlyTeams = false, options = {}) {
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

	findByNameOrFnameContaining(name, discussion = false, teams = false, onlyTeams = false, options = {}) {
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
				{ name: nameRegex, federated: { $ne: true } },
				{ fname: nameRegex },
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

	findByTeamId(teamId, options = {}) {
		const query = {
			teamId,
			teamMain: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	findPaginatedByTeamIdContainingNameAndDefault(teamId, name, teamDefault, ids, options = {}) {
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

	findByTeamIdAndRoomsId(teamId, rids, options = {}) {
		const query = {
			teamId,
			_id: {
				$in: rids,
			},
		};

		return this.find(query, options);
	}

	findRoomsByNameOrFnameStarting(name, options) {
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

	findRoomsWithoutDiscussionsByRoomIds(name, roomIds, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
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

	findPaginatedRoomsWithoutDiscussionsByRoomIds(name, roomIds, options) {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const query = {
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

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid, name, groupsToAccept, options) {
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
			$and: [{ $or: [{ federated: { $exists: false } }, { federated: false }] }],
		};
		return this.find(query, options);
	}

	unsetTeamId(teamId, options = {}) {
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

	unsetTeamById(rid, options = {}) {
		return this.updateOne({ _id: rid }, { $unset: { teamId: '', teamDefault: '' } }, options);
	}

	setTeamById(rid, teamId, teamDefault, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamDefault } }, options);
	}

	setTeamMainById(rid, teamId, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamId, teamMain: true } }, options);
	}

	setTeamByIds(rids, teamId, options = {}) {
		return this.updateMany({ _id: { $in: rids } }, { $set: { teamId } }, options);
	}

	setTeamDefaultById(rid, teamDefault, options = {}) {
		return this.updateOne({ _id: rid }, { $set: { teamDefault } }, options);
	}

	findChannelsWithNumberOfMessagesBetweenDate({ start, end, startOfLastWeek, endOfLastWeek, onlyCount = false, options = {} }) {
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
		const params = [...firstParams, sort];

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

	findOneByNameOrFname(name, options) {
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

	async findOneByNonValidatedName(name, options) {
		const room = await this.findOneByNameOrFname(name, options);
		if (room) {
			return room;
		}

		return this.findOneByName(name, options);
	}

	findOneByName(name, options = {}) {
		return this.col.findOne({ name }, options);
	}

	findDefaultRoomsForTeam(teamId) {
		return this.col.find({
			teamId,
			teamDefault: true,
			teamMain: {
				$exists: false,
			},
		});
	}

	incUsersCountByIds(ids, inc = 1) {
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

		return this.updateMany(query, update);
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

	findByBroadcast(options) {
		return this.find(
			{
				broadcast: true,
			},
			options,
		);
	}

	findByActiveLivestream(options) {
		return this.find(
			{
				'streamingOptions.type': 'livestream',
			},
			options,
		);
	}

	setAsFederated(roomId) {
		return this.updateOne({ _id: roomId }, { $set: { federated: true } });
	}

	setRoomTypeById(roomId, roomType) {
		return this.updateOne({ _id: roomId }, { $set: { t: roomType } });
	}

	setRoomNameById(roomId, name) {
		return this.updateOne({ _id: roomId }, { $set: { name } });
	}

	setFnameById(_id, fname) {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};

		return this.updateOne(query, update);
	}

	setRoomTopicById(roomId, topic) {
		return this.updateOne({ _id: roomId }, { $set: { description: topic } });
	}

	findByE2E(options) {
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

	countByType(t) {
		return this.col.countDocuments({ t });
	}

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(searchTerm, teamIds, roomIds, options) {
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

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(searchTerm, rids, options) {
		const query = {
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

	findPaginatedByTypeAndIds(type, ids, options) {
		const query = {
			t: type,
			_id: {
				$in: ids,
			},
		};

		return this.findPaginated(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(uid, options) {
		const query = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne(query, options);
	}

	findFederatedRooms(options) {
		const query = {
			federated: true,
		};

		return this.find(query, options);
	}

	findCountOfRoomsWithActiveCalls() {
		const query = {
			// No matter the actual "status" of the call, if the room has a callStatus, it means there is/was a call
			callStatus: { $exists: true },
		};

		return this.col.countDocuments(query);
	}

	incMsgCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				msgs: inc,
			},
		};

		return this.updateOne(query, update);
	}

	decreaseMessageCountById(_id, count = 1) {
		return this.incMsgCountById(_id, -count);
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
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

	setCallStatus(_id, status) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				callStatus: status,
			},
		};

		return this.updateOne(query, update);
	}

	setCallStatusAndCallStartTime(_id, status) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				callStatus: status,
				webRtcCallStartTime: new Date(),
			},
		};

		return this.updateOne(query, update);
	}

	setReactionsInLastMessage(roomId, reactions) {
		return this.updateOne({ _id: roomId }, { $set: { 'lastMessage.reactions': reactions } });
	}

	unsetReactionsInLastMessage(roomId) {
		return this.updateOne({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
	}

	unsetAllImportIds() {
		const query = {
			importIds: {
				$exists: true,
			},
		};

		const update = {
			$unset: {
				importIds: 1,
			},
		};

		return this.updateMany(query, update);
	}

	updateLastMessageStar(roomId, userId, starred) {
		let update;
		const query = { _id: roomId };

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

	setLastMessagePinned(roomId, pinnedBy, pinned, pinnedAt) {
		const query = { _id: roomId };

		const update = {
			$set: {
				'lastMessage.pinned': pinned,
				'lastMessage.pinnedAt': pinnedAt || new Date(),
				'lastMessage.pinnedBy': pinnedBy,
			},
		};

		return this.updateOne(query, update);
	}

	setLastMessageAsRead(roomId) {
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

	setDescriptionById(_id, description) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				description,
			},
		};
		return this.updateOne(query, update);
	}

	setStreamingOptionsById(_id, streamingOptions) {
		const update = {
			$set: {
				streamingOptions,
			},
		};
		return this.updateOne({ _id }, update);
	}

	setReadOnlyById(_id, readOnly) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				ro: readOnly,
			},
		};

		return this.updateOne(query, update);
	}

	setDmReadOnlyByUserId(_id, ids, readOnly, reactWhenReadOnly) {
		const query = {
			uids: {
				$size: 2,
				$in: [_id],
			},
			...(ids && Array.isArray(ids) ? { _id: { $in: ids } } : {}),
			t: 'd',
		};

		const update = {
			$set: {
				ro: readOnly,
				reactWhenReadOnly,
			},
		};

		return this.updateMany(query, update);
	}

	getDirectConversationsByUserId(_id, options) {
		return this.find({ t: 'd', uids: { $size: 2, $in: [_id] } }, options);
	}

	// 2
	setAllowReactingWhenReadOnlyById(_id, allowReacting) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				reactWhenReadOnly: allowReacting,
			},
		};
		return this.updateOne(query, update);
	}

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.updateOne({ _id }, update);
	}

	unsetAvatarData(_id) {
		const update = {
			$set: {
				avatarETag: Date.now(),
			},
			$unset: {
				avatarOrigin: 1,
			},
		};

		return this.updateOne({ _id }, update);
	}

	setSystemMessagesById(_id, systemMessages) {
		const query = {
			_id,
		};
		const update =
			systemMessages && systemMessages.length > 0
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

	setE2eKeyId(_id, e2eKeyId, options) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				e2eKeyId,
			},
		};

		return this.updateOne(query, update, options);
	}

	findOneByImportId(_id, options) {
		const query = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = { fname };

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options, includeFederatedRooms = false) {
		const query = {
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

	findById(roomId, options) {
		return this.findOne({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: { $in: [].concat(roomIds) } }, options);
	}

	findByType(type, options) {
		const query = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type, ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	async findBySubscriptionUserId(userId, options) {
		const data = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((item) => item.rid);

		const query = {
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

	async findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
		const ids = (await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray()).map((item) => item.rid);

		const query = {
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

	findByNameAndType(name, type, options) {
		const query = {
			t: type,
			name,
		};

		// do not use cache
		return this.find(query, options);
	}

	findByNameAndTypeNotDefault(name, type, options, includeFederatedRooms = false) {
		const query = {
			t: type,
			default: {
				$ne: true,
			},
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
			...(includeFederatedRooms
				? { $or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }] }
				: { $or: [{ federated: { $exists: false } }, { federated: false }], name }),
		};

		// do not use cache
		return this.find(query, options);
	}

	// 3
	findByNameAndTypesNotInIds(name, types, ids, options, includeFederatedRooms = false) {
		const query = {
			_id: {
				$nin: ids,
			},
			t: {
				$in: types,
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
				{
					// Also return the main room of public teams
					// this will have no effect if the method is called without the 'c' type, as the type filter is outside the $or group.
					teamMain: true,
					t: 'c',
				},
			],
			...(includeFederatedRooms
				? {
						$or: [{ $and: [{ $or: [{ federated: { $exists: false } }, { federated: false }], name }] }, { federated: true, fname: name }],
				  }
				: { $or: [{ federated: { $exists: false } }, { federated: false }], name }),
		};

		// do not use cache
		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findDirectRoomContainingAllUsernames(usernames, options) {
		const query = {
			t: 'd',
			usernames: { $size: usernames.length, $all: usernames },
			usersCount: usernames.length,
		};

		return this.findOne(query, options);
	}

	findByTypeAndName(type, name, options) {
		const query = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameOrId(type, identifier, options) {
		const query = {
			t: type,
			$or: [{ name: identifier }, { _id: identifier }],
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameContaining(type, name, options) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const query = {
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeInIdsAndNameContaining(type, ids, name, options) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const query = {
			_id: {
				$in: ids,
			},
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findGroupDMsByUids(uids, options) {
		return this.find(
			{
				usersCount: { $gt: 2 },
				uids: { $in: uids },
			},
			options,
		);
	}

	find1On1ByUserId(userId, options) {
		return this.find(
			{
				uids: userId,
				usersCount: 2,
			},
			options,
		);
	}

	findByCreatedOTR() {
		return this.find({ createdOTR: true });
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);
		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.updateOne(query, update);
	}

	archiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: true,
			},
		};

		return this.updateOne(query, update);
	}

	unarchiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: false,
			},
		};

		return this.updateOne(query, update);
	}

	setNameById(_id, name, fname) {
		const query = { _id };

		const update = {
			$set: {
				name,
				fname,
			},
		};

		return this.updateOne(query, update);
	}

	incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
		if (inc == null) {
			inc = 1;
		}
		const query = { _id };

		const update = {
			$set: {
				lm: lastMessageTimestamp,
			},
			$inc: {
				msgs: inc,
			},
		};

		if (lastMessage) {
			update.$set.lastMessage = lastMessage;
		}

		return this.updateOne(query, update);
	}

	incUsersCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.updateOne(query, update);
	}

	// 4
	incUsersCountNotDMsByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
			t: { $ne: 'd' },
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.updateMany(query, update);
	}

	setLastMessageById(_id, lastMessage) {
		const query = { _id };

		const update = {
			$set: {
				lastMessage,
			},
		};

		return this.updateOne(query, update);
	}

	async resetLastMessageById(_id, lastMessage = undefined) {
		const query = { _id };

		const update = lastMessage
			? {
					$set: {
						lastMessage,
					},
			  }
			: {
					$unset: {
						lastMessage: 1,
					},
			  };

		return this.updateOne(query, update);
	}

	replaceUsername(previousUsername, username) {
		const query = { usernames: previousUsername };

		const update = {
			$set: {
				'usernames.$': username,
			},
		};

		return this.updateMany(query, update);
	}

	replaceMutedUsername(previousUsername, username) {
		const query = { muted: previousUsername };

		const update = {
			$set: {
				'muted.$': username,
			},
		};

		return this.updateMany(query, update);
	}

	replaceUsernameOfUserByUserId(userId, username) {
		const query = { 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.updateMany(query, update);
	}

	setJoinCodeById(_id, joinCode) {
		let update;
		const query = { _id };

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

	setTypeById(_id, type) {
		const query = { _id };
		const update = {
			$set: {
				t: type,
			},
		};
		if (type === 'p') {
			update.$unset = { default: '' };
		}

		return this.updateOne(query, update);
	}

	setTopicById(_id, topic) {
		const query = { _id };

		const update = {
			$set: {
				topic,
			},
		};

		return this.updateOne(query, update);
	}

	setAnnouncementById(_id, announcement, announcementDetails) {
		const query = { _id };

		const update = {
			$set: {
				announcement,
				announcementDetails,
			},
		};

		return this.updateOne(query, update);
	}

	setCustomFieldsById(_id, customFields) {
		const query = { _id };

		const update = {
			$set: {
				customFields,
			},
		};

		return this.updateOne(query, update);
	}

	muteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$addToSet: {
				muted: username,
			},
			$pull: {
				unmuted: username,
			},
		};

		return this.updateOne(query, update);
	}

	unmuteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$pull: {
				muted: username,
			},
			$addToSet: {
				unmuted: username,
			},
		};

		return this.updateOne(query, update);
	}

	saveFeaturedById(_id, featured) {
		const query = { _id };
		const set = ['true', true].includes(featured);

		const update = {
			[set ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.updateOne(query, update);
	}

	saveDefaultById(_id, defaultValue) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue,
			},
		};

		return this.updateOne(query, update);
	}

	saveFavoriteById(_id, favorite, defaultValue) {
		const query = { _id };

		const update = {
			...(favorite && defaultValue && { $set: { favorite } }),
			...((!favorite || !defaultValue) && { $unset: { favorite: 1 } }),
		};

		return this.updateOne(query, update);
	}

	saveRetentionEnabledById(_id, value) {
		const query = { _id };

		const update = {};

		if (value == null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.updateOne(query, update);
	}

	saveRetentionMaxAgeById(_id, value) {
		const query = { _id };

		value = Number(value);
		if (!value) {
			value = 30;
		}

		const update = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionExcludePinnedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	// 5
	saveRetentionIgnoreThreadsById(_id, value) {
		const query = { _id };

		const update = {
			[value === true ? '$set' : '$unset']: {
				'retention.ignoreThreads': true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionFilesOnlyById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveRetentionOverrideGlobalById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.updateOne(query, update);
	}

	saveEncryptedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.updateOne(query, update);
	}

	updateGroupDMsRemovingUsernamesByUsername(username, userId) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $gt: 2 },
		};

		const update = {
			$pull: {
				usernames: username,
				uids: userId,
			},
		};

		return this.updateMany(query, update);
	}

	async createWithIdTypeAndName(_id, type, name, extraData) {
		const room = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0,
			usersCount: 0,
		};

		Object.assign(room, extraData);

		await this.insertOne(room);
		return room;
	}

	async createWithFullRoomData(room) {
		delete room._id;

		room._id = (await this.insertOne(room)).insertedId;
		return room;
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.deleteOne(query);
	}

	removeByIds(ids) {
		return this.deleteMany({ _id: { $in: ids } });
	}

	removeDirectRoomContainingUsername(username) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $lte: 2 },
		};

		return this.deleteMany(query);
	}

	countDiscussions() {
		return this.col.countDocuments({ prid: { $exists: true } });
	}

	setOTRForDMByRoomID(rid) {
		const query = { _id: rid, t: 'd' };

		const update = {
			$set: {
				createdOTR: true,
			},
		};

		return this.updateOne(query, update);
	}
}
