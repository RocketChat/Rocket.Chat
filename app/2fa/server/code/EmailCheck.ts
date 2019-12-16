import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer';
import { Users } from '../../../models/server';
import { ICodeCheck } from './ICodeCheck';
import { IUser } from '../../../../definition/IUser';

export class EmailCheck implements ICodeCheck {
	public getUserVerifiedEmails(user: IUser): string[] {
		if (!Array.isArray(user.emails)) {
			return [];
		}
		return user.emails.filter(({ verified }) => verified).map((e) => e.address);
	}

	public isEnabled(user: IUser): boolean {
		if (!settings.get('Accounts_TwoFactorAuthentication_By_Email_Enabled')) {
			return false;
		}

		if (!user.services?.email2fa?.enabled) {
			return false;
		}

		return this.getUserVerifiedEmails(user).length > 0;
	}

	public send2FAEmail(address: string, random: string): void {
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

		if (!user.services || !Array.isArray(user.services?.emailCode)) {
			return false;
		}

		// Remove non digits
		codeFromEmail = codeFromEmail.replace(/([^\d])/g, '');

		Users.removeExpiredEmailCodesOfUserId(user._id);

		const valid = user.services.emailCode.find(({ code, expire }) => {
			if (expire < new Date()) {
				return false;
			}

			if (bcrypt.compareSync(codeFromEmail, code)) {
				Users.removeEmailCodeByUserIdAndCode(user._id, code);
				return true;
			}

			return false;
		});

		return !!valid;
	}

	public sendEmailCode(user: IUser): string[] {
		const emails = this.getUserVerifiedEmails(user);
		const random = Random._randomString(6, '0123456789');
		const encryptedRandom = bcrypt.hashSync(random, Accounts._bcryptRounds());
		const expire = new Date();

		// TODO: Add setting to define the expiration range?
		expire.setHours(expire.getHours() + 1);

		Users.addEmailCodeByUserId(user._id, encryptedRandom, expire);

		for (const address of emails) {
			this.send2FAEmail(address, random);
		}

		return emails;
	}

	public processInvalidCode(user: IUser): void {
		Users.removeExpiredEmailCodesOfUserId(user._id);

		const hasValidCode = user.services?.emailCode?.find(({ expire }) => expire > new Date()) !== undefined;

		if (hasValidCode) {
			return;
		}

		this.sendEmailCode(user);
	}
}
