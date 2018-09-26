import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.addKeyToChain'(key) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.addKeyToChain' });
		}

		return RocketChat.models.Users.addKeyToChainByUserId(userId, key);
	},
});
