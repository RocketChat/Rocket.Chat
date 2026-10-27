import { Email } from 'meteor/email';
import type { SendMailOptions } from 'nodemailer';

import { SystemLogger } from '../lib/logger/system';
import { configureMailTransport, sendMail } from '../lib/notifications/email/transport';
import type { ICachedSettings } from '../settings/CachedSettings';

// @types/meteor declares customTransport as a function, but Meteor reads it as an assignable property.
const MeteorEmail = Email as unknown as { customTransport?: (mail: SendMailOptions & { packageSettings?: unknown }) => Promise<void> };

/** Sends all server email, Meteor accounts email included, through one transport built from the SMTP settings, or from MAIL_URL when SMTP_Host is empty. */
export function configureSMTP(settings: ICachedSettings): void {
	MeteorEmail.customTransport = ({ packageSettings: _packageSettings, ...mail }) => sendMail(mail);

	settings.watchMultiple(
		['SMTP_Host', 'SMTP_Port', 'SMTP_Username', 'SMTP_Password', 'SMTP_Protocol', 'SMTP_Pool', 'SMTP_IgnoreTLS'],
		() => {
			SystemLogger.info('Updating SMTP transport');

			const host = settings.get<string>('SMTP_Host');
			if (!host) {
				configureMailTransport(process.env.MAIL_URL);
				return;
			}

			const protocol = settings.get<string>('SMTP_Protocol');
			const username = settings.get<string>('SMTP_Username');
			const password = settings.get<string>('SMTP_Password');
			const port = parseInt(settings.get<string>('SMTP_Port'));
			const ignoreTLS = protocol === 'smtp' && settings.get<boolean>('SMTP_IgnoreTLS');

			configureMailTransport({
				host,
				secure: protocol === 'smtps',
				pool: settings.get<boolean>('SMTP_Pool'),
				...(port && { port }),
				...(username && password && { auth: { user: username, pass: password } }),
				...(ignoreTLS && { ignoreTLS }),
			});
		},
	);
}
