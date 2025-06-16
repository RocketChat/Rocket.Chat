import { isOAuthUser, type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import bcrypt from 'bcrypt';
import { Accounts } from 'meteor/accounts-base';

import type { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';
import { i18n } from '../../../../server/lib/i18n';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

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

		if (!settings.get('Accounts_twoFactorAuthentication_email_available_for_OAuth_users') && isOAuthUser(user)) {
			return false;
		}

		if (!user.services?.email2fa?.enabled) {
			return false;
		}

		return this.getUserVerifiedEmails(user).length > 0;
	}

	private async send2FAEmail(address: string, random: string, user: IUser): Promise<void> {
		const language = user.language || settings.get('Language') || 'en';

		const t = i18n.getFixedT(language);

		await Mailer.send({
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

	public async verify(user: IUser, codeFromEmail: string): Promise<boolean> {
		if (!this.isEnabled(user)) {
			return false;
		}

		if (!user.services?.emailCode) {
			return false;
		}

		// Remove non digits
		codeFromEmail = codeFromEmail.replace(/([^\d])/g, '');

		const { code, expire } = user.services.emailCode;

		if (expire < new Date()) {
			return false;
		}

		if (await bcrypt.compare(codeFromEmail, code)) {
			await Users.removeEmailCodeOfUserId(user._id);
			return true;
		}

		await Users.incrementInvalidEmailCodeAttempt(user._id);

		return false;
	}

	public async sendEmailCode(user: IUser): Promise<void> {
		const emails = this.getUserVerifiedEmails(user);
		const random = Random._randomString(6, '0123456789');
		const encryptedRandom = await bcrypt.hash(random, Accounts._bcryptRounds());
		const expire = new Date();
		const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);

		expire.setSeconds(expire.getSeconds() + expirationInSeconds);

		await Users.addEmailCodeByUserId(user._id, encryptedRandom, expire);

		for await (const address of emails) {
			await this.send2FAEmail(address, random, user);
		}
	}

	public async processInvalidCode(user: IUser): Promise<IProcessInvalidCodeResult> {
		await Users.removeExpiredEmailCodeOfUserId(user._id);

		// Generate new code if the there isn't any code with more than 5 minutes to expire
		const expireWithDelta = new Date();
		expireWithDelta.setMinutes(expireWithDelta.getMinutes() - 5);

		const emails = this.getUserVerifiedEmails(user);

		const emailOrUsername = user.username || emails[0];

		const hasValidCode =
			user.services?.emailCode?.expire &&
			user.services?.emailCode?.expire > expireWithDelta &&
			!(await this.maxFaildedAttemtpsReached(user));
		if (hasValidCode) {
			return {
				emailOrUsername,
				codeGenerated: false,
				codeExpires: user.services?.emailCode?.expire,
			};
		}

		await this.sendEmailCode(user);

		return {
			codeGenerated: true,
			emailOrUsername,
		};
	}

	public async maxFaildedAttemtpsReached(user: IUser) {
		const maxAttempts = settings.get<number>('Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts');
		return (await Users.maxInvalidEmailCodeAttemptsReached(user._id, maxAttempts)) as boolean;
	}
}
