import { Meteor } from 'meteor/meteor';

import { TOTP } from '../lib/totp';

export function verify(user, code) {
	if (user.services && user.services.totp && user.services.totp.enabled === true) {
		if (!code) {
			throw new Meteor.Error('totp-required', 'TOTP Required');
		}

		const verified = TOTP.verify({
			secret: user.services.totp.secret,
			token: code,
			userId: user._id,
			backupTokens: user.services.totp.hashedBackup,
		});

		if (verified !== true) {
			throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
		}
	}
}
