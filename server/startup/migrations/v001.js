import { Migrations } from 'meteor/rocketchat:migrations';
import { Users } from 'meteor/rocketchat:models';
import { generateUsernameSuggestion } from 'meteor/rocketchat:lib';

Migrations.add({
	version: 1,
	up() {
		return Users.find({
			username: {
				$exists: false,
			},
			lastLogin: {
				$exists: true,
			},
		}).forEach((user) => {
			const username = generateUsernameSuggestion(user);
			if (username && username.trim() !== '') {
				return Users.setUsername(user._id, username);
			} else {
				return console.log('User without username', JSON.stringify(user, null, ' '));
			}
		});
	},
});
