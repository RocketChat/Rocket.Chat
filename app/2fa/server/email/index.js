import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { settings } from '../../../settings';
import * as Mailer from '../../../mailer';
import { Users } from '../../../models/server';

export function getUserVerifiedEmails(user) {
	return user.emails.filter(({ verified }) => verified);
}

export function send2FAEmail({ address, random }) {
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

export function validate(user, codeFromEmail) {
	if (typeof codeFromEmail === 'string') {
		// Remove non digits
		codeFromEmail = codeFromEmail.replace(/([^\d])/g, '');
	}

	Users.removeExpiredEmailCodesOfUserId(user._id);

	const valid = user.emailCode.find(({ code, expire }) => {
		if (expire < Date.now) {
			return false;
		}

		if (bcrypt.compareSync(codeFromEmail, code)) {
			Users.removeEmailCodeByUserIdAndCode(user._id, code);
			return true;
		}

		return false;
	});

	if (!valid) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
	}
}

export function generateCodeAndSend(user, emails) {
	const random = Random._randomString(6, '0123456789');

	const encryptedRandom = bcrypt.hashSync(random, Accounts._bcryptRounds());

	const expire = new Date();
	// TODO: Add setting to define the expiration range?
	expire.setHours(expire.getHours() + 1);

	Users.addEmailCodeByUserId(user._id, encryptedRandom, expire);

	for (const { address } of emails) {
		send2FAEmail({ address, random });
	}

	throw new Meteor.Error('totp-required', 'TOTP Required');
}

export function verifyOrSend(user, code) {
	if (Array.isArray(user.emails)) {
		const verifiedEmails = getUserVerifiedEmails(user);
		if (verifiedEmails.length === 0) {
			return;
		}

		if (!code) {
			generateCodeAndSend(user, verifiedEmails);
		}

		if (Array.isArray(user.emailCode)) {
			validate(user, code);
		}
	}
}
