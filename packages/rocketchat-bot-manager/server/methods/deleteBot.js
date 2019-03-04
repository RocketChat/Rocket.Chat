import { Meteor } from 'meteor/meteor';
import * as Models from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { deleteUser } from 'meteor/rocketchat:lib';

Meteor.methods({
	deleteBot(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteBot',
			});
		}

		if (!hasPermission(Meteor.userId(), 'delete-bot-account')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteBot',
			});
		}

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'turnUserIntoBot' });
		}

		const user = Models.Users.findOneById(userId);
		if (!user || user.type !== 'bot') {
			throw new Meteor.Error('error-invalid-bot', 'Invalid bot', {
				method: 'deleteBot',
			});
		}

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = user.roles.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteBot',
				action: 'Remove_last_admin',
			});
		}

		deleteUser(userId);

		return true;
	},
});
