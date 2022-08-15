import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer';
import { Users } from '../../../models/server';
import type { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';

export class EmailCheck implements ICodeCheck {
	public readonly name = 'email';

	private getUserVerifiedEmails(user: IUser): string[] {
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

	private send2FAEmail(address: string, random: string, user: IUser): void {
		const language = user.language || settings.get('Language') || 'en';

		const t = (s: string): string => TAPi18n.__(s, { lng: language });

		Mailer.send({
			to: address,
			from: settings.get('From_Email'),
			subject: 'Authentication code',
			replyTo: undefined,
			data: {
				code: random.replace(/^(\d{3})/, '$1-'),
			},
			headers: undefined,
			text: `
${t('Here_is_your_authentication_code')}

__code__

${t('Do_not_provide_this_code_to_anyone')}
${t('If_you_didnt_try_to_login_in_your_account_please_ignore_this_email')}
`,
			html: `
				<p>${t('Here_is_your_authentication_code')}</p>
				<p style="font-size: 30px;">
					<b>__code__</b>
				</p>
				<p>${t('Do_not_provide_this_code_to_anyone')}</p>
				<p>${t('If_you_didnt_try_to_login_in_your_account_please_ignore_this_email')}</p>
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

	public sendEmailCode(user: IUser): void {
		const emails = this.getUserVerifiedEmails(user);
		const random = Random._randomString(6, '0123456789');
		const encryptedRandom = bcrypt.hashSync(random, Accounts._bcryptRounds());
		const expire = new Date();
		const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);

		expire.setSeconds(expire.getSeconds() + expirationInSeconds);

		Users.addEmailCodeByUserId(user._id, encryptedRandom, expire);

		for (const address of emails) {
			this.send2FAEmail(address, random, user);
		}
	}

	public processInvalidCode(user: IUser): IProcessInvalidCodeResult {
		Users.removeExpiredEmailCodesOfUserId(user._id);

		// Generate new code if the there isn't any code with more than 5 minutes to expire
		const expireWithDelta = new Date();
		expireWithDelta.setMinutes(expireWithDelta.getMinutes() - 5);

		const emails = this.getUserVerifiedEmails(user);

		const emailOrUsername = user.username || emails[0];

		const hasValidCode = user.services?.emailCode?.filter(({ expire }) => expire > expireWithDelta);
		if (hasValidCode?.length) {
			return {
				emailOrUsername,
				codeGenerated: false,
				codeCount: hasValidCode.length,
				codeExpires: hasValidCode.map((i) => i.expire),
			};
		}

		this.sendEmailCode(user);

		return {
			codeGenerated: true,
			emailOrUsername,
		};
	}
}
