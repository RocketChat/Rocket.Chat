const satelize = Npm.require('satelize');
Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}
	let country_name;
	const country_header = user.connection.httpHeaders['x-forwarded-for'];
	satelize.satelize({ip:country_header}, function(err, payload) {
		if (err) {
			return;
		}
		country_name = payload.country.en;
	});
	if (!country_name) {
		return;
	}
	let room_id;
	const is_channel_blacklisted = Meteor.users.findOne({
		$and: [{ _id: user.user._id}, {'automatic_channels':{$elemMatch:{'name': country_name, 'blacklisted': true}}}]
	});
	if (is_channel_blacklisted) {
		return;
	} else {
		const room = RocketChat.models.Rooms.findOneByIdOrName(country_name);
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
			const result = RocketChat.createRoom('c', country_name, user.user && user.user.username, [], false, {automatic:true});
			room_id = result.rid;

		}
		remove_user_from_automatic_channel(user.user, 'country', room_id);
		RocketChat.models.Users.update({ _id: user.user._id }, { $addToSet: { automatic_channels: {'name': country_name, 'channel_id': room_id, 'plugin': 'country', 'blacklisted': false} } });
	}
});
