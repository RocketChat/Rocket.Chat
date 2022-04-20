import { Meteor } from 'meteor/meteor';

import { CustomUserStatus } from '../../../models/server/raw';

Meteor.methods({
	async listCustomUserStatus() {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'listCustomUserStatus',
			});
		}

		return CustomUserStatus.find({}).toArray();
	},
});
