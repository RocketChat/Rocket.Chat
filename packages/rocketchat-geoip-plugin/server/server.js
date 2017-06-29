Accounts.onLogin(function(user) {
	if (!user.user._id || !user.user.username) {
		return;
	}
	const apiUrl = 'http://ip-api.com/json';
	const response = HTTP.get(apiUrl).data;
	if (!response || !response.country) {
		return;
	}
	let room_id;
	const is_channel_blacklisted = Meteor.users.findOne({
		$and: [{ _id: user.user._id}, {'automatic_channels':{$elemMatch:{'name': response.country, 'blacklisted': true}}}]
	});
	if (is_channel_blacklisted) {
		return;
	} else {
		const room = RocketChat.models.Rooms.findOneByIdOrName(response.country);
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
			const result = RocketChat.createRoom('c', response.country, user.user && user.user.username, [], true, false, {automatic:true});
			room_id = result.rid;

		}
		remove_user_from_automatic_channel(user.user, 'country', room_id);
		RocketChat.models.Users.update({ _id: user.user._id }, { $addToSet: { automatic_channels: {'name': response.country, 'channel_id': room_id, 'plugin': 'country', 'blacklisted': false} } });
	}
});
