export const automaticChannelsHandler ={};
automaticChannelsHandler.categories = [];

function removeUserFromOtherAutomaticChannels(user, categories) {
	const channelNames = categories.map(function(x) { return x.getChannelName(user); });

	const userSubscriptions = RocketChat.models.Subscriptions.findByTypeAndUserId('c', user.user._id).fetch();
	userSubscriptions.forEach((arrayItem) => {
		if (!channelNames.includes(arrayItem.name) && arrayItem._room.automatic) {
		// Remove the user from this other channel.
			const room = RocketChat.models.Rooms.findOneById(arrayItem._room._id);
			RocketChat.removeUserFromRoom(room._id, user.user);

			//delete the user if it is last.(There may be a race condition)
			if (room.usernames.length === 2) {
				RocketChat.eraseRoom(room._id);
			}
		}
	});
}

RocketChat.leaveAutomaticChannels = function(user, room) {
	automaticChannelsHandler.categories.forEach((arrayItem) => {
		if (room.categoryName === arrayItem.categoryName && RocketChat.settings.get(arrayItem.blacklist)) {
			RocketChat.models.Users.update({ _id: user._id }, { $addToSet: { ignoredAutomaticChannels: room.name } });
			if (room.usernames.length === 2) {
				RocketChat.eraseRoom(room._id);
			}
		}
	});
};

automaticChannelsHandler.addCategory = function(options) {
	return automaticChannelsHandler.categories.push({
		categoryName: options.categoryName,
		getChannelName :options.getChannelName,
		enable: options.enable,
		blacklist: options.blacklist
	});
};

Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}
	automaticChannelsHandler.categories.forEach((arrayItem) => {
		if (RocketChat.settings.get(arrayItem.enable) !== true) {
			return;
		}

		const channelName = arrayItem.getChannelName(user);
		if (channelName !== null) {
			if (user.user.ignoredAutomaticChannels) {
				if (user.user.ignoredAutomaticChannels.includes(channelName)) {
					return;
				}
			}
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
				RocketChat.createRoom('c', channelName, 'rocket.cat', [user.user.username], false, {automatic: true, categoryName: arrayItem.categoryName});
			}
		}
	});
	// remove user from previously added automatic channels
	removeUserFromOtherAutomaticChannels(user, automaticChannelsHandler.categories);
});
