import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { EmailBridge } from '@rocket.chat/apps-engine/server/bridges/EmailBridge';

import { i18n } from '../../../../server/lib/i18n';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

export class AppEmailBridge extends EmailBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async sendOtpCodeThroughSMTP(email: string, code: string, language: string, appId: string): Promise<void> {
		this.orch.debugLog(`The app: ${appId} is requesting an OTP code to be sent to: ${email}`);
		await this.send2FAEmail(email, code, language);
	}

	private async send2FAEmail(email: string, code: string, language: string): Promise<void> {
		const t = (s: string): string => i18n.t(s, { lng: language || 'en' });

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
}
