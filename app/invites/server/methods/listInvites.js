import { Meteor } from 'meteor/meteor';

import { Invites } from '../../../models';

Meteor.methods({
	listInvites() {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
		}

		return Invites.find({}).fetch();
	},
});
