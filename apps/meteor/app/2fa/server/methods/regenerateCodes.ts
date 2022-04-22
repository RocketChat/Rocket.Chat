import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { TOTP } from '../lib/totp';

Meteor.methods({
	'2fa:regenerateCodes'(userToken) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:regenerateCodes',
			});
		}

		if (!user.services || !user.services.totp || !user.services.totp.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = TOTP.verify({
			secret: user.services.totp.secret,
			token: userToken,
			userId,
			backupTokens: user.services.totp.hashedBackup,
		});

		if (verified) {
			const { codes, hashedCodes } = TOTP.generateCodes();

			Users.update2FABackupCodesByUserId(Meteor.userId(), hashedCodes);
			return { codes };
		}
	},
});
