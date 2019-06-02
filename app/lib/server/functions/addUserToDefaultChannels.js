import { Rooms, Subscriptions, Messages } from '../../../models';
import { callbacks } from '../../../callbacks';
import { createRoom } from './createRoom';
import { settings } from '../../../settings';

export const addUserToDefaultChannels = function(user, silenced) {
	callbacks.run('beforeJoinDefaultChannels', user);
	const defaultRooms = Rooms.findByDefaultAndTypes(true, ['c', 'p'], { fields: { usernames: 0 } }).fetch();
	defaultRooms.forEach((room) => {
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

	// Create a newsfeed for the user
	if (settings.get('Newsfeed_enabled')) {
		if (user.type === 'user') {
			if (!Rooms.findOneByName(`news_${ user._id }`)) {
				createRoom('n', `news_${ user._id }`, user.username, [], true, {}, {});
			}
		}
	}
};
