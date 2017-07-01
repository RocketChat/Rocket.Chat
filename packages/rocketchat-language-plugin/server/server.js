const parser = Npm.require('accept-language-parser');
const languages = Npm.require('languages');

function get_language(languages_codes) {

	const languages_parsed = parser.parse(languages_codes);
	if (languages_parsed.length===0) {
		return null;
	}
	const priority_language = languages_parsed[0].code;

	const priority_language_fullname = languages.getLanguageInfo(priority_language);
	return priority_language_fullname;
}
//TODO :Export the function
remove_user_from_automatic_channel = function(user, channelType, channelId) {
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
};

//TODO :Export the function
leave_automatic_channel = function(room_name, user, plugins) {
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

	const browser_language = get_language(user.connection.httpHeaders['accept-language']);
	if (browser_language === null) {
		return;
	}
	let room_id;
	// check if the browser_language channel is blacklisted
	const is_channel_blacklisted = Meteor.users.findOne({
		$and: [{ _id: user.user._id}, {'automatic_channels':{$elemMatch:{'name': browser_language.name, 'blacklisted': true}}}]
	});
	if (is_channel_blacklisted) {
		//just remove user from the other language channel
		remove_user_from_automatic_channel(user.user);
		return;
	} else {
		const room = RocketChat.models.Rooms.findOneByIdOrName(browser_language.name);
		if (room) {
			//check if user is present in the channel
			room_id = room._id;
			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user.user._id);
			if (subscription) {
				return;
			} else {

				RocketChat.addUserToRoom(room._id, user.user);

			}
		} else {
			const result = RocketChat.createRoom('c', browser_language.name, user.user && user.user.username, [], false, {automatic:true});
			room_id = result.rid;

		}
		//remove_user_from_automatic_channel(user.user, room_id);
		remove_user_from_automatic_channel(user.user, 'language', room_id);

		//add_channel_to_user's collection
		RocketChat.models.Users.update({ _id: user.user._id }, { $addToSet: { automatic_channels: {'name': browser_language.name, 'channel_id': room_id, 'plugin': 'language', 'blacklisted': false} } });
	}
});


