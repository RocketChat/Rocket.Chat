import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(rid, uid, options = {}) {
		const query = {
			_id: rid,
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

	async getMostRecentAverageChatDurationTime(numberMostRecentChats, department) {
		const aggregate = [
			{
				$match: {
					t: 'l',
					closedAt: { $exists: true },
					metrics: { $exists: true },
					'metrics.chatDuration': { $exists: true },
					...department && { departmentId: department },
				},
			},
			{ $sort: { closedAt: -1 } },
			{ $limit: numberMostRecentChats },
			{ $group: { _id: null, chats: { $sum: 1 }, sumChatDuration: { $sum: '$metrics.chatDuration' } } },
			{ $project: { _id: '$_id', avgChatDuration: { $divide: ['$sumChatDuration', '$chats'] } } },
		];

		const [statistic] = await this.col.aggregate(aggregate).toArray();
		return statistic;
	}

	findAllTagsFollowedByUser(teamIds, roomIds, options = {}) {
		const query = {
			$and: [
				{ teamMain: { $exists: false } },
				{ prid: { $exists: false } },
				{ t: 'c' },
				{
					$or: [
						{$and: [
							{
								teamId: { $exists: true },
							},
							{
								teamId: { $in: teamIds },
							},
						]},
						{$and: [
							{
								teamId: { $exists: false },
							},
							...roomIds?.length > 0 ? [{
								_id: {
									$in: roomIds,
								},
							}] : [],
						]},
					],
				},
			],
		};

		return this.col.distinct("tags", query, options);
	}

	findRecommendedChannels(text, teamIds, roomIds, tags, pagination){
		const searchTerm = text && new RegExp(text, 'i');

		const query = [
			{ 
				$match: {
					$and: [
						{ teamMain: { $exists: false } },
						{ prid: { $exists: false } },
						{ t: 'c' },
						{
							$or: [
								{$and: [
									{
										teamId: { $exists: true },
									},
									{
										teamId: { $nin: teamIds },
									},
								]},
								{$and: [
									{
										teamId: { $exists: false },
									},
									...roomIds?.length > 0 ? [{
										_id: {
											$nin: roomIds,
										},
									}] : [],
								]},
							],
						},
						{
							tags: {
								$in: tags,
							}
						},
						...searchTerm ? [{
							$or: [{
								name: searchTerm,
							}, {
								fname: searchTerm,
							}],
						}] : [],
					]
				}
			},
			{
				$project: {
					t: 1,
					description: 1,
					topic: 1,
					name: 1,
					fname: 1,
					lastMessage: 1,
					ts: 1,
					archived: 1,
					default: 1,
					featured: 1,
					usersCount: 1,
					prid: 1,
					teamId: 1,
					tags: 1,
					tagsCount: {
						$size: {
						"$ifNull": [
							"$tags",
							[]
						]
						}
					}
				}
			},
			{
				$sort: {
					tagsCount: -1,
				}
			},
			{
				$facet: {
					count: [
						{
							$count: 'count'
						}
					],
					results: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
				}
			}
		];

		return this.col.aggregate(query);
	}

	findTrendingChannels(text, teamIds, roomIds, tags, pagination){
		const searchTerm = text && new RegExp(text, 'i');

		const query = [
			{ 
				$match: {
					$and: [
						{ teamMain: { $exists: false } },
						{ prid: { $exists: false } },
						{ t: 'c' },
						{
							$or: [
								{
									teamId: { $exists: false },
								},
								{
									teamId: { $in: teamIds },
								},
								...roomIds?.length > 0 ? [{
									_id: {
										$in: roomIds,
									},
								}] : [],
							],
						},
						...searchTerm ? [{
							$or: [{
								name: searchTerm,
							}, {
								fname: searchTerm,
							}],
						}] : [],
					]
				}
			},
			{
				$project: {
					t: 1,
					description: 1,
					topic: 1,
					name: 1,
					fname: 1,
					lastMessage: 1,
					ts: 1,
					archived: 1,
					default: 1,
					featured: 1,
					usersCount: 1,
					prid: 1,
					teamId: 1,
					tags: 1,
					msgs: 1,
					tagsCount: {
						$size: {
						"$ifNull": [
							"$tags",
							[]
						]
						}
					},
					recommended: {
						$cond: [
						  {
							$in: [
							  tags,
							  "$tags"
							]
						  },
						  1,
						  0
						]
					  },
				}
			},
			{
				$sort: {
					tagsCount: -1,
					msgs: -1,
					usersCount: -1,
					lastMessage: -1,
					ts: -1,
				}
			},
			{
				$facet: {
					results: [{ $skip: 0 }, { $limit: 25 }],
				}
			}
		];

		return this.col.aggregate(query);
	}

	findByNameContainingAndTypes(name, types, discussion = false, teams = false, showOnlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const onlyTeamsQuery = showOnlyTeams ? { teamMain: { $exists: true } } : {};

		const teamCondition = teams ? {} : {
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
		return this.find(query, options);
	}

	findByTypes(types, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const teamCondition = teams ? {} : {
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
		return this.find(query, options);
	}

	findByNameContaining(name, discussion = false, teams = false, onlyTeams = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const teamCondition = teams ? {} : {
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

		return this.find(query, options);
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

	findByTeamIdContainingNameAndDefault(teamId, name, teamDefault, ids, options = {}) {
		const query = {
			teamId,
			teamMain: {
				$exists: false,
			},
			...name ? { name: new RegExp(escapeRegExp(name), 'i') } : {},
			...teamDefault === true ? { teamDefault } : {},
			...ids ? { $or: [{ t: 'c' }, { _id: { $in: ids } }] } : {},
		};

		return this.find(query, options);
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

	findChannelAndPrivateByNameStarting(name, sIds, options) {
		const nameRegex = new RegExp(`^${ escapeRegExp(name).trim() }`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			teamMain: {
				$exists: false,
			},
			$or: [{
				teamId: {
					$exists: false,
				},
			}, {
				teamId: {
					$exists: true,
				},
				_id: {
					$in: sIds,
				},
			}],
		};

		return this.find(query, options);
	}

	findRoomsWithoutDiscussionsByRoomIds(name, roomIds, options) {
		const nameRegex = new RegExp(`^${ escapeRegExp(name).trim() }`, 'i');

		const query = {
			_id: {
				$in: roomIds,
			},
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			$or: [{
				teamId: {
					$exists: false,
				},
			}, {
				teamId: {
					$exists: true,
				},
				_id: {
					$in: roomIds,
				},
			}],
			prid: { $exists: false },
		};

		return this.find(query, options);
	}

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid, name, groupsToAccept, options) {
		const nameRegex = new RegExp(`^${ escapeRegExp(name).trim() }`, 'i');

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
							$and: [
								{ $gte: ['$$message.date', start] },
								{ $lte: ['$$message.date', end] },
							],
						},
					},
				},
				lastWeekMessages: {
					$filter: {
						input: '$messages',
						as: 'message',
						cond: {
							$and: [
								{ $gte: ['$$message.date', startOfLastWeek] },
								{ $lte: ['$$message.date', endOfLastWeek] },
							],
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
		const firstParams = [lookup, messagesProject, messagesUnwind, messagesGroup, lastWeekMessagesUnwind, lastWeekMessagesGroup, presentationProject];
		const sort = { $sort: options.sort || { messages: -1 } };
		const params = [...firstParams, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}

		return this.col.aggregate(params).toArray();
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

		return this.update(query, update, { multi: true });
	}

	findOneByNameOrFname(name, options = {}) {
		return this.col.findOne({ $or: [{ name }, { fname: name }] }, options);
	}
}
