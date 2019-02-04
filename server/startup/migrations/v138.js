RocketChat.Migrations.add({
	version: 138,
	up() {
		console.log('Fixing message reactions');

		RocketChat.models.Messages.find({ reactions : { $exists: true } }).forEach(function(message) {
			const newReactions = {};
			const reactionsArray = Object.keys(message.reactions);

			reactionsArray.forEach((reaction) => {
				const usernames = message.reactions[reaction].usernames; // eslint-disable-line prefer-destructuring
				newReactions[reaction] = { users: [] };

				usernames.forEach((username) => {
					const user = RocketChat.models.Users.findOneByUsername(username, {});

					if (user) {
						const userId = user._id;
						newReactions[reaction].users.push({ _id: userId, username });
					} else { // username has been changed, in that case don't(can't) store id
						newReactions[reaction].users.push({ username });
					}

				});
			});

			RocketChat.models.Messages.update({ _id: message._id }, {
				$set: {
					reactions: newReactions,
				},
			});

		});
		return console.log('End');
	},
});
