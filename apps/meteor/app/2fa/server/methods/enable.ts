import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { TOTP } from '../lib/totp';

Meteor.methods({
	'2fa:enable'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:enable',
			});
		}

		const secret = TOTP.generateSecret();

		Users.disable2FAAndSetTempSecretByUserId(userId, secret.base32);

		return {
			secret: secret.base32,
			url: TOTP.generateOtpauthURL(secret, user.username),
		};
	},
});
