
export const plugin_handler ={};
plugin_handler.plugins = [];
function remove_user_from_automatic_channel(user, plugins) {
	const channelNames = plugins.map(function(x) { return x.channelName(user); });

	const userSubscriptions = RocketChat.models.Subscriptions.findByTypeAndUserId('c', user.user._id).fetch();
	userSubscriptions.forEach((arrayItem) => {
		if (!channelNames.includes(arrayItem.name) && arrayItem._room.automatic) {
		// Remove the user from this other channel.
			const room = RocketChat.models.Rooms.findOneById(arrayItem._room._id);
			RocketChat.removeUserFromRoom(room._id, user.user);

			//delete the user if it is last.(There may be a race condition)
			if (room.usernames.length===1) {
				Meteor.call('eraseRoom', room._id, true);

			}
		}
	});
}

export function leave_automatic_channel(user, room, plugins) {
	//plugins is an array which has the names of those channels for which admin wants the blacklisted feature to work
	if (plugins.includes(room.plugin_name)) {
		RocketChat.models.Users.update({ _id: user._id }, { $addToSet: { ignored_automatic_channels: room.name } });
		if (room.usernames.length===1) {
			Meteor.call('eraseRoom', room._id, true);
		}
	} else {
		return;
	}
}

plugin_handler.addPlugin = function(options) {
	return plugin_handler.plugins.push({
		pluginName: options.pluginName,
		channelName :options.channelName
	});
};

Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}
	plugin_handler.plugins.forEach((arrayItem) => {
		if (arrayItem.channelName(user)!==null) {
			const channelName = arrayItem.channelName(user);
			if (user.user.ignored_automatic_channels.includes(channelName)) {
				return;
			} else {
				const room = RocketChat.models.Rooms.findOneByIdOrName(channelName);
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
					RocketChat.createRoom('c', channelName, user.user && user.user.username, [], false, {automatic: true, plugin_name: arrayItem.pluginName});
				}
			}
		}
	});
	// remove user from previously added automatic channels
	remove_user_from_automatic_channel(user, plugin_handler.plugins);
});
