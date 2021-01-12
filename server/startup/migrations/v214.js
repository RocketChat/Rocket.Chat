import { Migrations } from '../../../app/migrations';
import { Messages, Users } from '../../../app/models';

function createNewReactions(reactions) {
	const newReactions = {};

	for (const [reactionName, reactionObj] of Object.entries(reactions)) {
		const { usernames } = reactionObj;

		if (!usernames) { return {}; }

		const newUserIds = [];
		const newUsernames = [];

		// only push reaction of those users who can be found by their `usernames`
		for (const username of usernames) {
			const foundUser = username
				&& Users.findOne({ username }, { fields: { _id: 1, username: 1 } });

			if (foundUser) {
				newUserIds.push(foundUser._id);
				newUsernames.push(foundUser.username);
			}
		}

		newReactions[reactionName] = {
			userIds: newUserIds,
			usernames: newUsernames,
		};
	}

	return newReactions;
}

function migrate() {
	Messages.find({ reactions: { $exists: true } }).forEach((message) => {
		// create new reactions object along with the `user._id`
		const newReactions = createNewReactions(message.reactions);
		Messages.update(
			{ _id: message._id },
			{
				$set: {
					reactions: newReactions,
				},
			},
		);
	});
}

Migrations.add({
	version: 213,
	up() {
		console.info('Now fixing message reactions ...');
		migrate();
		console.info('Done fixing message reactions !');
	},
});
