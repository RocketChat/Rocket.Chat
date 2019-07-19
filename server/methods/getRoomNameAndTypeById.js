import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../app/models/server/models/Rooms';
import { Subscriptions } from '../../app/models/server/models/Subscriptions';
import { hasPermission } from '../../app/authorization/server';

Meteor.methods({
	getRoomNameAndTypeByNameOrId(nameOrId) {
		check(nameOrId, String);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameAndTypeByNameOrId',
			});
		}

		const room = Rooms.findOne({ $or: [{ name: nameOrId }, { _id: nameOrId }] });

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameAndTypeByNameOrId',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(nameOrId, userId, { fields: { _id: 1 } });
		if (subscription) {
			return { t: room.t, name: room.name };
		}

		if (room.t !== 'c' || hasPermission(userId, 'view-c-room') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameAndTypeByNameOrId',
			});
		}

		return { t: room.t, name: room.name };
	},
});
