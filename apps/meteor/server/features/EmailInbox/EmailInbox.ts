import { Meteor } from 'meteor/meteor';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type { IEmailInbox } from '@rocket.chat/core-typings';
import { EmailInbox, EmailMessageHistory } from '@rocket.chat/models';

import { IMAPInterceptor } from '../../email/IMAPInterceptor';
import { onEmailReceived } from './EmailInbox_Incoming';
import { logger } from './logger';
import { settings } from '../../../app/settings/server';

export type Inbox = {
	imap: IMAPInterceptor;
	smtp: Mail;
	config: IEmailInbox;
};

export const inboxes = new Map<string, Inbox>();

export async function configureEmailInboxes(): Promise<void> {
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});

	logger.info('Clearing old email inbox registrations');
	for (const { imap } of inboxes.values()) {
		imap.stop();
	}

	inboxes.clear();

	for await (const emailInboxRecord of emailInboxesCursor) {
		logger.info(`Setting up email interceptor for ${emailInboxRecord.email}`);

		const imap = new IMAPInterceptor(
			{
				password: emailInboxRecord.imap.password,
				user: emailInboxRecord.imap.username,
				host: emailInboxRecord.imap.server,
				port: emailInboxRecord.imap.port,
				...(emailInboxRecord.imap.secure
					? {
							tls: emailInboxRecord.imap.secure,
							tlsOptions: {
								rejectUnauthorized: false,
							},
					  }
					: {}),
			},
			{
				deleteAfterRead: false,
				filter: [['UNSEEN'], ['SINCE', emailInboxRecord._updatedAt]],
				rejectBeforeTS: emailInboxRecord._updatedAt,
				markSeen: true,
				maxRetries: emailInboxRecord.imap.maxRetries,
			},
		);

		imap.on(
			'email',
			Meteor.bindEnvironment(async (email) => {
				if (!email.messageId) {
					return;
				}

				try {
					await EmailMessageHistory.create({ _id: email.messageId, email: emailInboxRecord.email });
					onEmailReceived(email, emailInboxRecord.email, emailInboxRecord.department);
				} catch (e: any) {
					// In case the email message history has been received by other instance..
					logger.error(e);
				}
			}),
		);

		imap.start();

		const smtp = nodemailer.createTransport({
			host: emailInboxRecord.smtp.server,
			port: emailInboxRecord.smtp.port,
			secure: emailInboxRecord.smtp.secure,
			auth: {
				user: emailInboxRecord.smtp.username,
				pass: emailInboxRecord.smtp.password,
			},
		});

		inboxes.set(emailInboxRecord.email, { imap, smtp, config: emailInboxRecord });
	}

	logger.info(`Configured a total of ${inboxes.size} inboxes`);
}

Meteor.startup(() => {
	settings.watchOnce('Livechat_Routing_Method', (_) => {
		configureEmailInboxes();
	});
});
