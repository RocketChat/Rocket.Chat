import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.setUserPublicAndPivateKeys'({ public_key, private_key }) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.setUserPublicAndPivateKeys' });
		}

		return RocketChat.models.Users.setE2EPublicAndPivateKeysByUserId(userId, { public_key, private_key });
	},
});
