import { Meteor } from 'meteor/meteor';

import { Subscriptions, Rooms } from '../../app/models/server';
import { canAccessRoom, hasPermission, roomAccessAttributes } from '../../app/authorization/server';
import { findUsersOfRoom } from '../lib/findUsersOfRoom';

Meteor.methods({
	getUsersOfRoom(rid, showAll, { limit, skip } = {}, filter) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, broadcast: 1 } });
		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		if (!canAccessRoom(room, { _id: userId })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const total = Subscriptions.findByRoomIdWhenUsernameExists(rid).count();

		const users = findUsersOfRoom({
			rid,
			status: !showAll ? { $ne: 'offline' } : undefined,
			limit,
			skip,
			filter,
		}).fetch();

		return {
			total,
			records: users,
		};
	},
});
