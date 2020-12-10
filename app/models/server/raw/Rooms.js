import { escapeRegExp } from '../../../../lib/escapeRegExp';
import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(rid, uid, options) {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
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

	findByNameContainingAndTypes(name, types, discussion = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');
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
		};
		return this.find(query, options);
	}

	findByTypes(types, discussion = false, options = {}) {
		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
		};
		return this.find(query, options);
	}

	findByNameContaining(name, discussion = false, options = {}) {
		const nameRegex = new RegExp(escapeRegExp(name).trim(), 'i');

		const query = {
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};
		return this.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ escapeRegExp(name).trim() }`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
		};

		return this.find(query, options);
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
}
