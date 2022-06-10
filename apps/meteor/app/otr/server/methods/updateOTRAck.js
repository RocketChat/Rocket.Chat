import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models';

Meteor.methods({
	updateOTRAck(_id, ack) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOTRAck' });
		}
		Messages.updateOTRAck(_id, ack);
	},
});
