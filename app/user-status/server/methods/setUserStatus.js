import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';
import s from 'underscore.string';

Meteor.methods({
	setUserStatus(statusType, statusText) {
		Meteor.call('UserPresence:setDefaultStatus', statusType);

		if (statusText) {
			statusText = s.trim(statusText);
			if (statusText.length > 120) {
				statusText = statusText.substr(0, 120);
			}

			const userId = Meteor.userId();
			Users.updateStatusText(userId, statusText);
		}
	},
});
