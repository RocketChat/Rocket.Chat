function get_language(languages_codes) {
	const parser = Npm.require('accept-language-parser');
	const languages = Npm.require('languages');

	const languages_parsed = parser.parse(languages_codes);
	const priority_language = languages_parsed[0].code;

	const priority_language_fullname = languages.getLanguageInfo(priority_language);
	return priority_language_fullname;
}


function add_or_update_user(channel, plugin_name) {
	Meteor.users.update(Meteor.userId(), {
		$push: {
			automatic_channels: {'name': channel, 'plugin': plugin_name, 'blacklisted': 'false'}
		}
	});
}

function remove_user_from_automatic_channel() {
	const user_info = RocketChat.models.Users.findOneById(Meteor.userId());
	// get the name of channels to which user is added
	const to_be_removed = user_info.automatic_channels.filter(function(obj) {
		return obj.blacklisted ==='false';
	});
	if (to_be_removed.length!==0) {
		Meteor.users.update({
			_id: Meteor.userId()
		}, {
			$pull: { automatic_channels: { 'name': to_be_removed[0].name } }
		});
		const room = RocketChat.models.Rooms.findOneByIdOrName(to_be_removed[0].name);
		RocketChat.removeUserFromRoom(room._id, Meteor.user());
	} else {
		return;
	}
}
Accounts.onLogin(function(user) {
	if (!Meteor.userId()) {
		return;
	}
	const browser_language = get_language(user.connection.httpHeaders['accept-language']);
	// check if the browser_language channel is blacklisted
	const is_channel_blacklisted = Meteor.users.findOne({
		$and: [{ _id: Meteor.userId()}, {'automatic_channels':{$elemMatch:{'name': browser_language.name, 'blacklisted':'true'}}}]
	});
	if (is_channel_blacklisted) {
		//just remove user from the other language channel
		remove_user_from_automatic_channel();
		return;
	} else {
		const room = RocketChat.models.Rooms.findOneByIdOrName(browser_language.name);
		if (room) {
			//check if user is present in the channel
			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, Meteor.userId());
			if (subscription) {
				return;
			} else {
				Meteor.call('joinRoom', room._id);
				remove_user_from_automatic_channel();
				add_or_update_user(room.name, 'language');
			}
		} else {
			Meteor.call('createChannel', browser_language.name, []);
			remove_user_from_automatic_channel();
			add_or_update_user(browser_language.name, 'language');
		}
	}
});


