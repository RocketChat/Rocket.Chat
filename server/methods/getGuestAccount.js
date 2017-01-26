Meteor.methods({
	getGuestAccount: () => {
		let guestId = 1;
		let lastGuest = RocketChat.models.Users.findOne({guestId: {$gt: 0}}, {sort: {DateTime: -1, limit: 1}});
		if (lastGuest) {
			guestId = lastGuest.guestId + 1;
		}
		let username = 'anonymous-' + guestId;
		while (RocketChat.models.Users.findOne({ username: username })) {
			guestId++;
			username = 'anonymous-' + guestId;
		}

		let userId = Accounts.createUser({
			username: username,
			email: username + '@rocket-chat.guest',
			password: '',
			profile: {name: username}
		});

		Accounts.setPassword(userId, '');

		RocketChat.models.Users.update(userId, {$set: {guestId: guestId}});

		return username;
	}
});
