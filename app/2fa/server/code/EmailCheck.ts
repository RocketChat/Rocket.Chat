import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer';
import { Users } from '../../../models/server';
import { ICodeCheck } from './ICodeCheck';
import { IUser, IUserEmail } from '../../../../definition/IUser';

export class EmailCheck implements ICodeCheck {
	public getUserVerifiedEmails(user: IUser): IUserEmail[] {
		if (!Array.isArray(user.emails)) {
			return [];
		}
		return user.emails.filter(({ verified }) => verified);
	}

	public isEnabled(user: IUser): boolean {
		// TODO: Check settings
		return this.getUserVerifiedEmails(user).length > 0;
	}

	public send2FAEmail(address: string, random: string): void {
		console.log('send2FAEmail', address, random);
		Mailer.send({
			to: address,
			from: settings.get('From_Email'),
			subject: 'Authentication code',
			replyTo: undefined,
			data: undefined,
			headers: undefined,
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

	public verify(user: IUser, codeFromEmail: string): boolean {
		if (!this.isEnabled(user)) {
			return false;
		}

		if (!Array.isArray(user.services?.emailCode)) {
			return false;
		}

		if (typeof codeFromEmail === 'string') {
			// Remove non digits
			codeFromEmail = codeFromEmail.replace(/([^\d])/g, '');
		}

		Users.removeExpiredEmailCodesOfUserId(user._id);

		const valid = user.services?.emailCode.find(({ code, expire }) => {
			if (expire < Date.now) {
				return false;
			}

			if (bcrypt.compareSync(codeFromEmail, code)) {
				Users.removeEmailCodeByUserIdAndCode(user._id, code);
				return true;
			}

			return false;
		});

		return valid;
	}

	public processInvalidCode(user: IUser): void {
		console.log('processInvalidCode');
		const emails = this.getUserVerifiedEmails(user);
		const random = Random._randomString(6, '0123456789');

		const encryptedRandom = bcrypt.hashSync(random, Accounts._bcryptRounds());

		const expire = new Date();
		// TODO: Add setting to define the expiration range?
		expire.setHours(expire.getHours() + 1);

		Users.addEmailCodeByUserId(user._id, encryptedRandom, expire);

		for (const { address } of emails) {
			this.send2FAEmail(address, random);
		}
	}
}
