import { SystemLogger } from '../lib/logger/system';
import { configureMailTransport } from '../lib/notifications/email/transport';
import type { ICachedSettings } from '../settings/CachedSettings';

export function configureSMTP(settings: ICachedSettings): void {
	settings.watchMultiple(
		['SMTP_Host', 'SMTP_Port', 'SMTP_Username', 'SMTP_Password', 'SMTP_Protocol', 'SMTP_Pool', 'SMTP_IgnoreTLS'],
		() => {
			SystemLogger.info('Updating process.env.MAIL_URL');

			const host = settings.get<string>('SMTP_Host');
			if (!host) {
				delete process.env.MAIL_URL;
				configureMailTransport(undefined);
				return;
			}

			const protocol = settings.get<string>('SMTP_Protocol');
			const username = settings.get<string>('SMTP_Username');
			const password = settings.get<string>('SMTP_Password');
			const rawPort = settings.get<string>('SMTP_Port');
			const port = parseInt(rawPort);
			const pool = settings.get<boolean>('SMTP_Pool');
			const ignoreTLS = protocol === 'smtp' && settings.get<boolean>('SMTP_IgnoreTLS');
			const auth = username && password ? { user: username, pass: password } : undefined;

			process.env.MAIL_URL = `${protocol}://`;

			if (auth) {
				process.env.MAIL_URL += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
			}

			process.env.MAIL_URL += encodeURIComponent(host);

			if (rawPort) {
				process.env.MAIL_URL += `:${port}`;
			}

			process.env.MAIL_URL += `?pool=${pool}`;

			if (ignoreTLS) {
				process.env.MAIL_URL += '&secure=false&ignoreTLS=true';
			}

			configureMailTransport({
				host,
				secure: protocol === 'smtps',
				pool,
				...(port && { port }),
				...(auth && { auth }),
				...(ignoreTLS && { ignoreTLS }),
			});
		},
	);
}
