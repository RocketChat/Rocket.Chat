Meteor.methods({
	getGuestAccount: () => {
		const guestPrefix = RocketChat.settings.get('Accounts_GuestNamePrefix');
		const guestPostfix = RocketChat.settings.get('Accounts_GuestNamePostfix');

		const guests = RocketChat.models.Users.find(
			{
				username: {$regex: new RegExp(guestPrefix + '\d' + guestPostfix, 'i')},
				guestId: {$exists: true}
			},
			{sort: {guestId: -1}}
		).fetch();

		let guestId = null, username = guestPrefix, anonymousCounter = 1;
		if (!_.isEmpty(guests)) {
			// Since we are sorting the results by guestId, the first one
			// is always the greatest id
			guestId = (guests[0].guestId ? guests[0].guestId + 1 : 1);
			anonymousCounter = guests.length + 1;
		} else {
			guestId = 1;
		}

		username += anonymousCounter + guestPostfix;
		while (RocketChat.models.Users.findOne({ name: username })) {
			anonymousCounter ++;
			username = guestPrefix + anonymousCounter + guestPostfix;
		}

		const email = username + '@rocket-chat.guest';

		const userId = Accounts.createUser({
			email: email,
			password: ''
		});

		RocketChat.models.Users.setName(userId, username);
		RocketChat.models.Users.setGuestId(userId, guestId);
		Accounts.setPassword(userId, '');

		return email;
	}
});
