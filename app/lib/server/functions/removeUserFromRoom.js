import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';
import { api } from '../../../../server/sdk/api';

export const removeUserFromRoom = function(rid, user, options = {}) {
	const room = Rooms.findOneById(rid);

	if (room) {
		callbacks.run('beforeLeaveRoom', user, room);

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id, { fields: { _id: 1 } });

		if (subscription) {
			const removedUser = user;
			if (options.byUser) {
				Messages.createUserRemovedWithRoomIdAndUser(rid, user, {
					u: options.byUser,
				});
			} else {
				Messages.createUserLeaveWithRoomIdAndUser(rid, removedUser);
			}
		}

		if (room.t === 'l') {
			Messages.createCommandWithRoomIdAndUser('survey', rid, user);
		}

		Subscriptions.removeByRoomIdAndUserId(rid, user._id);
		api.broadcast('user.roleUpdate', {
			type: 'kicked',
			u: {
				_id: user._id,
				username: user.username,
				name: user.name,
			},
			scope: room._id,
		});
		Meteor.defer(function() {
			// TODO: CACHE: maybe a queue?
			callbacks.run('afterLeaveRoom', user, room);
		});
	}
};
