import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-sdk';

Meteor.methods({
	async getUserRoles() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserRoles' });
		}

		return Authorization.getUsersFromPublicRoles();
	},
});
