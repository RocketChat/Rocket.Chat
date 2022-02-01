import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models';

Meteor.methods({
	sendSystemMessages(rid, user) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendSystemMessages' });
		}
        console.log("Test");
		Messages.createOtrChatJoinedWithRoomIdAndUser(rid, user);
	},
});
