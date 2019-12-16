import { Meteor } from 'meteor/meteor';

import Users from '../../../models/server/models/Users';

Meteor.methods({
	'2fa:enable-email'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		Users.enableEmail2FAByUserId(Meteor.userId());

		return true;
	},
});
