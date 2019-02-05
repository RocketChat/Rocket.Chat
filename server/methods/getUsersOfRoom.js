import { Meteor } from 'meteor/meteor';

Meteor.methods({
	async getUsersOfRoom(rid, showAll, { limit, skip } = {}) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !RocketChat.authz.hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(rid);

		const sort = {
			$sort: {
				[RocketChat.settings.get('UI_Use_Real_Name') ? 'u.name' : 'u.username']: 1,
			},
		};

		return {
			total: subscriptions.count(),
			records: await RocketChat.models.Subscriptions.model.rawCollection().aggregate([
				{ $match: { rid } },
				{
					$lookup:
						{
							from: 'users',
							localField: 'u._id',
							foreignField: '_id',
							as: 'u',
						},
				},
				{
					$project: {
						'u._id': 1,
						'u.name': 1,
						'u.username': 1,
						'u.status': 1,
					},
				},
				...(showAll ? [] : [{ $match: { 'u.status': { $in: ['online', 'away', 'busy'] } } }]),
				...(skip > 0 ? [{ $skip: skip }] : []),
				...(limit > 0 ? [{ $limit: limit }] : []),
				sort,
				{
					$project: {
						_id: { $arrayElemAt: ['$u._id', 0] },
						name: { $arrayElemAt: ['$u.name', 0] },
						username: { $arrayElemAt: ['$u.username', 0] },
					},
				},
			]).toArray(),
		};
	},
});
