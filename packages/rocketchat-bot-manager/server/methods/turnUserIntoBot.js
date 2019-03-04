import { Meteor } from 'meteor/meteor';
import * as Models from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';

Meteor.methods({
	async turnUserIntoBot(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'turnUserIntoBot' });
		}

		if (hasPermission(Meteor.userId(), 'edit-bot-account') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'turnUserIntoBot',
			});
		}

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'turnUserIntoBot' });
		}

		const update = Models.Users.update({ _id: userId }, {
			$set: {
				type: 'bot',
				roles: ['bot'],
			},
		});
		if (update <= 0) {
			throw new Meteor.Error('error-not-updated', 'User not updated', {
				method: 'turnUserIntoBot',
			});
		}

		return true;
	},
});
