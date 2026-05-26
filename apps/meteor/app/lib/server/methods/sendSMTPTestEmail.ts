import type { ServerMethods } from '@rocket.chat/ddp-client';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendSMTPTestEmail(): {
			message: string;
			params: string[];
		};
	}
}

Meteor.methods<ServerMethods>({
	/**
	 * @deprecated Scheduled for removal in 9.0.0. No caller found in this repository — kept for external DDP clients only.
	 */
	async sendSMTPTestEmail() {
		methodDeprecationLogger.method('sendSMTPTestEmail', '9.0.0', []);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendSMTPTestEmail',
			});
		}
		const user = await Meteor.userAsync();
		if (!user?.emails?.[0]?.address) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email', {
				method: 'sendSMTPTestEmail',
			});
		}
		try {
			await Mailer.send({
				to: user.emails[0].address,
				from: settings.get('From_Email'),
				subject: 'SMTP Test Email',
				html: '<p>You have successfully sent an email</p>',
			});
		} catch ({ message }: any) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
				method: 'sendSMTPTestEmail',
				message,
			});
		}
		return {
			message: 'Sending_your_mail_to_s',
			params: [user.emails[0].address],
		};
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'sendSMTPTestEmail',
		userId() {
			return true;
		},
	},
	1,
	1000,
);
