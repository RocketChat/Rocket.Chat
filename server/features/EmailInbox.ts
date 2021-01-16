import { EmailInbox } from '../../app/models/server/raw';
import { IMAPInterceptor } from '../email/IMAPInterceptor';

const IMAPInboxes = new Set<IMAPInterceptor>();

async function configureEmailInboxes(): Promise<void> {
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});

	for (const imap of IMAPInboxes) {
		imap.stop();
	}

	IMAPInboxes.clear();

	for await (const emailInboxRecord of emailInboxesCursor) {
		console.log('Setting up email interceptor for', emailInboxRecord.email);

		// TODO: Get attachments
		const imap = new IMAPInterceptor({
			password: emailInboxRecord.imap.password,
			user: emailInboxRecord.imap.username,
			host: emailInboxRecord.imap.server,
			port: parseInt(emailInboxRecord.imap.port),
			tls: emailInboxRecord.imap.sslTls,
			tlsOptions: {
				rejectUnauthorized: false,
			},
			// debug: (...args: any[]): void => console.log(...args),
		}, {
			deleteAfterRead: false,
			filter: [['UNSEEN'], ['SINCE', emailInboxRecord.ts]],
			rejectBeforeTS: emailInboxRecord.ts,
			markSeen: false,
		});

		IMAPInboxes.add(imap);

		imap.on('email', (email) => {
			// TODO: Pass to the omni routing system
			console.log('NEW EMAIL =>', email.text, '====');
		});

		imap.start();
	}
}

// TODO: Sync changes
configureEmailInboxes();
