import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { TOTP } from '../lib/totp';

Meteor.methods({
	'2fa:disable'(code) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:disable',
			});
		}

		const verified = TOTP.verify({
			secret: user.services.totp.secret,
			token: code,
			userId,
			backupTokens: user.services.totp.hashedBackup,
		});

		if (!verified) {
			return false;
		}

		return Users.disable2FAByUserId(userId);
	},
});
