import { Rooms, Subscriptions, Messages } from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { callbacks } from 'meteor/rocketchat:callbacks';

export const addUserToDefaultChannels = function(user, silenced) {
	callbacks.run('beforeJoinDefaultChannels', user);
	const defaultRooms = Rooms.findByDefaultAndTypes(true, ['c', 'p'], { fields: { usernames: 0 } }).fetch();
	defaultRooms.forEach((room) => {

		// put user in default rooms
		const muted = room.ro && !hasPermission(user._id, 'post-readonly');
		if (muted) {
			Rooms.muteUsernameByRoomId(room._id, user.username);
		}

		if (!Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {

			// Add a subscription to this user
			Subscriptions.createWithRoomAndUser(room, user, {
				ts: new Date(),
				open: true,
				alert: true,
				unread: 1,
				userMentions: 1,
				groupMentions: 0,
			});

			// Insert user joined message
			if (!silenced) {
				Messages.createUserJoinWithRoomIdAndUser(room._id, user);
			}
		}
	});
};
