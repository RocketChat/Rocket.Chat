import { Subscriptions } from '../../../models';

export const addUserToChannel = function(user, room) {
	if (!Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {
		Subscriptions.createWithRoomAndUser(room, user, {
			ts: new Date(),
			open: true,
			alert: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			...room.favorite && { f: true },
		});
	}
};
