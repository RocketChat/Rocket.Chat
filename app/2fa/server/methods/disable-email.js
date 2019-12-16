import { Meteor } from 'meteor/meteor';

import Users from '../../../models/server/models/Users';
import { require2fa } from '../methodWrapper';

Meteor.methods({
	'2fa:disable-email': require2fa(function() {
		return Users.disableEmail2FAByUserId(Meteor.userId());
	}),
});
