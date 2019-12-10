import s from 'underscore.string';

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
		const nameRegex = new RegExp(s.escapeRegExp(name).trim(), 'i');
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
		const nameRegex = new RegExp(s.escapeRegExp(name).trim(), 'i');

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
}
