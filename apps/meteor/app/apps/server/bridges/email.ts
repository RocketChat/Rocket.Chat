import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { Random } from '@rocket.chat/random';
import bcrypt from 'bcrypt';
import { EmailBridge } from '@rocket.chat/apps-engine/server/bridges/EmailBridge';
import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer/server/api';
import { Accounts } from 'meteor/accounts-base';
import { i18n } from '../../../../server/lib/i18n';
import { addEmailCodeByContactEmail, findContactCodeFromChannelAndEmail, incrementInvalidEmailCodeAttemptByVerifyingMethod } from '../../../livechat/server/lib/Contacts';

export class AppEmailBridge extends EmailBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async sendOtpCodeThroughSMTP(email: string, channel: string, appId: string): Promise<any> {
        this.orch.debugLog(`The app: ${appId} is requesting an OTP code to be sent to: ${email}`);
		const random = Random._randomString(6, '0123456789');
        const encriptedRandom = await bcrypt.hash(random, Accounts._bcryptRounds());
        const expire = new Date();
        const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);

        expire.setSeconds(expire.getSeconds() + expirationInSeconds);

        await addEmailCodeByContactEmail(email, channel, encriptedRandom, expire);
        await this.send2FAEmail(email, random);
    }

    private async send2FAEmail(email: string, code: string): Promise<any> {
        // TODO: Fetch the language from within the app's settings
        const language = settings.get('Language') || 'en';
		const t = (s: string): string => i18n.t(s, { lng: language });

        await Mailer.send({
            to: email,
            from: settings.get('From_Email'),
            subject: 'Authentication code',
            replyTo: undefined,
            data: {
				code: code.replace(/^(\d{3})/, '$1-'),
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

	protected async verifyOTPCode(code: string, channel: string, email: string, appId: string): Promise<any> {
        this.orch.debugLog(`The app: ${appId} is verifying an OTP code sent to: ${email}`);

        const { code: actualCode, expiresAt, attempts } = await findContactCodeFromChannelAndEmail(channel, email);
        const normalizedCode = code.replace(/([^\d])/g, '');
		const maxAttempts = settings.get<number>('Accounts_TwoFactorAuthentication_Max_Invalid_Email_Code_Attempts');

        if (attempts > maxAttempts) {
            throw new Error('TODO: Max attempts exceeded, implement');
            // TODO: return unverified and generate new code
            return;
        }

        if (expiresAt < new Date()) {
            throw new Error('TODO: code expired, implement');
            // TODO: generate new code, since the old one has expired
            // TODO: Return the info saying the code has expired
            return;
        }

        if (await bcrypt.compare(normalizedCode, actualCode)) {
            throw new Error('TODO: Correct code, implement');
            // TODO: Remove the code from the channels list
            // TODO: Return object saying the code is valid
            return;
        }

        // Otherwise, the code is invalid, so we must increment the number of attempts
        // and return the status
        await incrementInvalidEmailCodeAttemptByVerifyingMethod(email, channel);
        throw new Error('TODO: Invalid code, implement');

        // TODO: Return object saying the attempt was wrong
        return;
    }
}
