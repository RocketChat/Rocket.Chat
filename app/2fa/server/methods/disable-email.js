import { Meteor } from 'meteor/meteor';

import Users from '../../../models/server/models/Users';
import { methodsWithTwoFactor } from '../twoFactorRequired';

methodsWithTwoFactor({
	'2fa:disable-email'() {
		return Users.disableEmail2FAByUserId(Meteor.userId());
	},
}, { disableRememberMe: true });
