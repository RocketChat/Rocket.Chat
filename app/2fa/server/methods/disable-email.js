import { Meteor } from 'meteor/meteor';

import Users from '../../../models/server/models/Users';
import { methodsWithTwoFactor } from '../twoFactorRequired';

methodsWithTwoFactor({
	'2fa:disable-email'() {
		Users.disableEmail2FAByUserId(Meteor.userId());

		return true;
	},
}, { disableRememberMe: true });
