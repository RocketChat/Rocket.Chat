import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';
import { TOTP } from '../lib/totp';

Meteor.methods({
	'resetPasswordWithTOTP'(userToken, hashedPassword, totpCode) {
		const query = {
			'services.password.reset.token' : userToken,
		};

		const user = Users.findOne(query, {});

		if (user && user.services && user.services.totp && user.services.totp.enabled === true) {
			if (!totpCode) {
				throw new Meteor.Error('totp-required', 'TOTP Required');
			}

			const verified = TOTP.verify({
				secret: user.services.totp.secret,
				token: totpCode,
				userId: user._id,
				backupTokens: user.services.totp.hashedBackup,
			});

			if (verified !== true) {
				throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
			}

			try {
				const result = Meteor.call('resetPassword', userToken, hashedPassword);
				console.log(result);
				return result;
			} catch (e) {
				// totp-required means the password was reset, but the auto login has failed because of the missing totp code
				// let's skip this error and call login again, including the totp code this time
				if (e.error !== 'totp-required') {
					throw e;
				}
			}

			return Meteor.call('login', {
				totp: {
					code : totpCode,
					login: {
						user: {
							username: user.username,
						},
						password: hashedPassword,
					},
				},
			});
		} else {
			return Meteor.call('resetPassword', userToken, hashedPassword);
		}
	},
});
