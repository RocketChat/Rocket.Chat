function remove_user_from_automatic_channel(user, channelType, channelId) {
	const collectionObj = RocketChat.models.Users.model.rawCollection();
	const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
	const oldUser = findAndModify({
		_id: user._id,
		automatic_channels:{
			$elemMatch: {
				blacklisted: false,
				plugin: channelType,
				channel_id: {$ne: channelId}
			}
		}
	}, [], {
		$pull: {
			automatic_channels: {
				blacklisted: false,
				plugin: channelType,
				channel_id: {$ne: channelId}
			}
		}
	});


	if (!oldUser.value) {
	// Nothing removed, no existing other channel.
		return;
	}

	oldUser.value.automatic_channels.forEach((arrayItem) => {
		if (arrayItem.channelId !== channelId && arrayItem.plugin === channelType && !arrayItem.blacklisted) {
		// Remove the user from this other channel.
			const room = RocketChat.models.Rooms.findOneById(arrayItem.channel_id);
			RocketChat.removeUserFromRoom(room._id, user);

			//delete the user if it is last.(There may be a race condition)
			if (room.usernames.length===1) {
				Meteor.call('eraseRoom', room._id, true);

			}
		}
	});
}

plugin_handler.leave_automatic_channel = function(room_name, user, plugins) {
	//plugins is an array which has the names of those channels for which admin wants the blacklisted feature to work
	Meteor.users.update({
		$and: [{ _id: user._id}, {'automatic_channels':{$elemMatch:{'name': room_name, 'plugin': { $in: plugins }}}}]

	}, {
		$set: {
			'automatic_channels.$.blacklisted' : true
		}
	});
	Meteor.users.update({
		$and: [{ _id: user._id}, {'automatic_channels':{$elemMatch:{'name': room_name, 'plugin': { $nin: plugins }}}}]
	}, {
		$pull: { automatic_channels: { blacklisted: false } }
	});
};

Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}
	let room_id;

	// this will contain information about plugins
	plugin_handler.plugins = [];

	// get user's browser's language
	get_language(user.connection.httpHeaders['accept-language']);

	// get user's country
	get_country(user.connection.httpHeaders['x-forwarded-for']);

	plugin_handler.plugins.forEach((arrayItem) => {
		if (arrayItem.channelName!==null) {

			// find if channel is blacklisted by user
			const is_channel_blacklisted = Meteor.users.findOne({
				$and: [{ _id: user.user._id}, {'automatic_channels':{$elemMatch:{'name': arrayItem.channelName, 'blacklisted': true}}}]
			});

			if (is_channel_blacklisted) {
				return;
			} else {
				const room = RocketChat.models.Rooms.findOneByIdOrName(arrayItem.channelName);
				if (room) {
					room_id = room._id;

					//check if user is present in the channel
					const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user.user._id);
					if (subscription) {
						return;
					} else {
						RocketChat.addUserToRoom(room._id, user.user);

					}
				} else {
					// if room does not exist, create one
					const result = RocketChat.createRoom('c', arrayItem.channelName, user.user && user.user.username, [], false, {automatic:true});
					room_id = result.rid;

				}
				// remove user from previously added automatic channels
				remove_user_from_automatic_channel(user.user, arrayItem.channelType, room_id);

				//add_channel_to_user's collection
				RocketChat.models.Users.update({ _id: user.user._id }, { $addToSet: { automatic_channels: {'name': arrayItem.channelName, 'channel_id': room_id, 'plugin': arrayItem.channelType, 'blacklisted': false} } });
			}
		}
	});
});
