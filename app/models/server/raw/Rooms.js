import { BaseRaw } from './BaseRaw';

export class RoomsRaw extends BaseRaw {
	findOneByRoomIdAndUserId(rid, uid, options) {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.col.findOne(query, options);
	}

	isUserInRole(uid, roleName, rid) {
		if (rid == null) {
			return;
		}

		const query = {
			'u._id': uid,
			rid,
			roles: roleName,
		};

		return this.findOne(query, { fields: { roles: 1 } });
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
}
