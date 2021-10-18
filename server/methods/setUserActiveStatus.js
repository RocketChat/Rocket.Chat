import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization';
import { setUserActiveStatus } from '../../app/lib/server/functions/setUserActiveStatus';

Meteor.methods({
	setUserActiveStatus(userId, active, confirmRelinquish) {
		check(userId, String);
		check(active, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus',
			});
		}

		if (hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserActiveStatus',
			});
		}

		setUserActiveStatus(userId, active, confirmRelinquish);

		return true;
	},
});
