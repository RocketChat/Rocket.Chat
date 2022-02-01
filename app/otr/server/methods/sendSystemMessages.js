import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models';

Meteor.methods({
	sendSystemMessages(rid, user, id) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendSystemMessages' });
		}
		Messages.createOtrSystemMessagesWithRoomIdAndUser(rid, user, id);
	},
});
