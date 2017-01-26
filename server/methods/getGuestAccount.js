Meteor.methods({
	getGuestAccount: () => {

		const guests = RocketChat.models.Users.find(
			{username: {$regex: /^anonymous-\d$/}},
			{sort: {guestId: -1}}
		).fetch();

		let guestId = null, username = 'anonymous-', anonymousCounter = 1;
		if (guests) {
			// Since we are sorting the results by guestId, the first one
			// is always the greatest id
			guestId = (guests[0].guestId ? guests[0].guestId + 1 : 1);
			anonymousCounter = guests.length + 1;
		} else {
			guestId = 1;
		}

		username += anonymousCounter;
		while (RocketChat.models.Users.findOne({ username: username })) {
			anonymousCounter ++;
			username = 'anonymous-' + anonymousCounter;
		}

		const userId = Accounts.createUser({
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
