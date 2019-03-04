import { Meteor } from 'meteor/meteor';
import * as Models from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { saveUser } from 'meteor/rocketchat:lib';

Meteor.methods({
	async turnBotIntoUser(botId, email) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'turnBotIntoUser' });
		}

		if (!hasPermission(Meteor.userId(), 'edit-bot-account')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'turnBotIntoUser',
			});
		}
		if (!botId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'turnBotIntoUser' });
		}

		const bot = Models.Users.findOneById(botId);
		if (!bot.emails && !email) {
			throw new Meteor.Error('error-missing-email', 'Can\'t convert bot account to user account without an e-mail', {
				method: 'turnBotIntoUser',
			});
		}

		const userData = {
			_id: botId,
			email,
		};

		saveUser(Meteor.userId(), userData);

		const update = Models.Users.update({ _id: botId }, {
			$set: {
				type: 'user',
				roles: ['user'],
			},
		});
		if (update <= 0) {
			throw new Meteor.Error('error-not-updated', 'Bot not updated', {
				method: 'turnBotIntoUser',
			});
		}

		return true;
	},
});
