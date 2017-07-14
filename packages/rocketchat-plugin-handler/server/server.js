import {get_country} from 'meteor/rocketchat:geoip-plugin';
import {get_language} from 'meteor/rocketchat:language-plugin';

function remove_user_from_automatic_channel(user, plugins) {
	const channelNames = plugins.map(function(x) { return x.channelName; });

	const userSubscriptions = RocketChat.models.Subscriptions.findByTypeAndUserId('c', user._id).fetch();
	userSubscriptions.forEach((arrayItem) => {
		if (!channelNames.includes(arrayItem.name) && arrayItem._room.automatic) {
		// Remove the user from this other channel.
			const room = RocketChat.models.Rooms.findOneById(arrayItem._room._id);
			RocketChat.removeUserFromRoom(room._id, user);

			//delete the user if it is last.(There may be a race condition)
			if (room.usernames.length===1) {
				Meteor.call('eraseRoom', room._id, true);

			}
		}
	});
}

const leave_automatic_channel = function(user, room, plugins =['language']) {
	//plugins is an array which has the names of those channels for which admin wants the blacklisted feature to work
	if (plugins.includes(room.plugin_name)) {
		RocketChat.models.Users.update({ _id: user._id }, { $addToSet: { ignored_automatic_channels: room.name } });
		if (room.usernames.length===1) {
			Meteor.call('eraseRoom', room._id, true);
		}
	} else {
		return;
	}
};
RocketChat.callbacks.add('afterLeaveRoom', leave_automatic_channel, RocketChat.callbacks.priority.LOW);

Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}

	// this will contain information about plugins
	const plugins = [];

	// get user's browser's language
	plugins.push(get_language(user.connection.httpHeaders['accept-language']));

	// get user's country
	plugins.push(get_country(user.connection.httpHeaders['x-forwarded-for']));

	plugins.forEach((arrayItem) => {
		if (arrayItem.channelName!==null) {
			if (user.user.ignored_automatic_channels.includes(arrayItem.channelName)) {
				return;
			} else {
				const room = RocketChat.models.Rooms.findOneByIdOrName(arrayItem.channelName);
				if (room) {

					//check if user is present in the channel
					const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user.user._id);
					if (subscription) {
						return;
					} else {
						RocketChat.addUserToRoom(room._id, user.user);

					}
				} else {
					// if room does not exist, create one
					RocketChat.createRoom('c', arrayItem.channelName, user.user && user.user.username, [], false, {automatic: true, plugin_name: arrayItem.channelType});
				}
			}
		}
	});
	// remove user from previously added automatic channels
	remove_user_from_automatic_channel(user.user, plugins);
});
