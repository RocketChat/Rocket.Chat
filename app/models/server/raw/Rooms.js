import { MongoInternals } from 'meteor/mongo';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

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
		const readPreference = readSecondaryPreferred(MongoInternals.defaultRemoteCollectionDriver().mongo);
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
			return this.col.aggregate(params, { allowDiskUse: true, readPreference });
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}

		return this.col.aggregate(params, { allowDiskUse: true, readPreference }).toArray();
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
