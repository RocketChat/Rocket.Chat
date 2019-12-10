import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import bcrypt from 'bcrypt';

import { TOTP } from './lib/totp';
import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import * as Mailer from '../../mailer';
import { Users } from '../../models/server';

const bcryptHash = Meteor.wrapAsync(bcrypt.hash);
const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
		return;
	}

	if (login.type === 'password' && login.user.services && login.user.services.totp && login.user.services.totp.enabled === true) {
		const { totp } = login.methodArguments[0];

		if (!totp || !totp.code) {
			throw new Meteor.Error('totp-required', 'TOTP Required');
		}

		const verified = TOTP.verify({
			secret: login.user.services.totp.secret,
			token: totp.code,
			userId: login.user._id,
			backupTokens: login.user.services.totp.hashedBackup,
		});

		if (verified !== true) {
			throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
		}
	}

	if (Array.isArray(login.user.emails)) {
		const verifiedEmails = login.user.emails.filter(({ verified }) => verified);

		if (verifiedEmails.length === 0) {
			return;
		}

		const { totp } = login.methodArguments[0];

		if (!totp || !totp.code) {
			const random = Random._randomString(6, '0123456789');

			const encryptedRandom = bcryptHash(random, Accounts._bcryptRounds());

			const expire = new Date();
			// TODO: Add setting to define the expiration range?
			expire.setHours(expire.getHours() + 1);

			Users.addEmailCodeByUserId(login.user._id, encryptedRandom, expire);

			for (const { address } of verifiedEmails) {
				Mailer.send({
					to: address,
					from: settings.get('From_Email'),
					subject: 'Authentication code',
					html: `
						<p>Here is your authentication code:</p>
						<p style="font-size: 30px;">
							<b>${ random.replace(/^(\d{3})/, '$1-') }</b>
						</p>
						<p>Do not provide this code to anyone.</p>
						<p>If you didn't try to login in your account please ignore this email.</p>
					`,
				});
			}

			throw new Meteor.Error('totp-required', 'TOTP Required');
		}

		if (Array.isArray(login.user.emailCode)) {
			Users.removeExpiredEmailCodesOfUserId(login.user._id);

			const valid = login.user.emailCode.find(({ code, expire }) => {
				if (expire < Date.now) {
					return false;
				}

				if (bcryptCompare(totp.code, code)) {
					Users.removeEmailCodeByUserIdAndCode(login.user._id, code);
					return true;
				}

				return false;
			});

			if (!valid) {
				throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
			}
		}
	}
}, callbacks.priority.MEDIUM, '2fa');
