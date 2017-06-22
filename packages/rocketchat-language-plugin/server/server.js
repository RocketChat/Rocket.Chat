const parser = Npm.require('accept-language-parser');
const languages = Npm.require('languages');

function get_language(languages_codes) {

	const languages_parsed = parser.parse(languages_codes);
	if (languages_parsed.length===0) {
		return;
	}
	const priority_language = languages_parsed[0].code;

	const priority_language_fullname = languages.getLanguageInfo(priority_language);
	return priority_language_fullname;
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
			$pull: { automatic_channels: { name: to_be_removed[0].name } }
		});
		const room = RocketChat.models.Rooms.findOneByIdOrName(to_be_removed[0].name);
		RocketChat.removeUserFromRoom(room._id, Meteor.user());
		// delete the room if its the last user
		if (room.usernames.length===1) {
			RocketChat.models.Messages.removeByRoomId(room._id);
			RocketChat.models.Subscriptions.removeByRoomId(room._id);
			RocketChat.models.Rooms.removeById(room._id);
		}

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

			}
		} else {
			RocketChat.createRoom('c', browser_language.name, Meteor.user() && Meteor.user().username, [], false, {'automatic':true});
			// removed user as the owner, so that no one is able to change the settings (eg-rename the room) except the admin
			const room_created = RocketChat.models.Rooms.findOneByIdOrName(browser_language.name);
			const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room_created._id, Meteor.userId());
			RocketChat.models.Subscriptions.removeRoleById(subscription._id, 'owner');
		}
		remove_user_from_automatic_channel();

		//add_channel_to_user's collection
		RocketChat.models.Users.update({ _id: Meteor.userId() }, { $addToSet: { automatic_channels: {'name': browser_language.name, 'plugin': 'language', 'blacklisted': 'false'} } });
	}
});


