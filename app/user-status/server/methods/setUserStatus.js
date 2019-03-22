import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';

Meteor.methods({
	setUserStatus(statusType, statusText) {
		Meteor.call('UserPresence:setDefaultStatus', statusType);

		const userId = Meteor.userId();
		Users.updateStatusText(userId, statusText);
	},
});
