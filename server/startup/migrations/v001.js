RocketChat.Migrations.add({
	version: 1,
	up() {
		return RocketChat.models.Users.find({
			username: {
				$exists: false
			},
			lastLogin: {
				$exists: true
			}
		}).forEach((user) => {
			const username = RocketChat.generateUsernameSuggestion(user);
			if (username && username.trim() !== '') {
				return RocketChat.models.Users.setUsername(user._id, username);
			} else {
				return console.log('User without username', JSON.stringify(user, null, ' '));
			}
		});
	}
});
