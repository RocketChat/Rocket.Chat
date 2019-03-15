import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '../../app/models';
import { hasPermission } from '../../app/authorization';

Meteor.methods({
	async getUsersOfRoom(rid, showAll) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const subscriptions = Subscriptions.findByRoomIdWhenUsernameExists(rid);

		return {
			total: subscriptions.count(),
			records: await Subscriptions.model.rawCollection().aggregate([
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
