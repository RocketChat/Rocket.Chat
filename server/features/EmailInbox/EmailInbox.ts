import { Meteor } from 'meteor/meteor';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

import { EmailInbox } from '../../../app/models/server/raw';
import { IMAPInterceptor } from '../../email/IMAPInterceptor';
import { IEmailInbox } from '../../../definition/IEmailInbox';
import { onEmailReceived } from './EmailInbox_Incoming';
import InstanceStatus from '../../../app/models/server/models/InstanceStatus';

export type Inbox = {
	imap: IMAPInterceptor;
	smtp: Mail;
	config: IEmailInbox;
}

export const inboxes = new Map<string, Inbox>();

export async function selectInstaceToJob(id: string): Promise<void> {
	// console.log(id);
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});

	for await (const emailInboxRecord of emailInboxesCursor) {
		EmailInbox.updateOne({ _id: emailInboxRecord._id }, { $set: { instance: id } });
	}
}

export async function configureEmailInboxes(): Promise<void> {
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});
	for (const { imap } of inboxes.values()) {
		imap.stop();
	}

	inboxes.clear();

	const instances = InstanceStatus.find().fetch();

	for await (const emailInboxRecord of emailInboxesCursor) {
		// console.log('instances', instances, emailInboxRecord.instance);
		if (instances.find((instance: any) => instance._id !== emailInboxRecord.instance)) {
			return;
		}
		console.log('Setting up email interceptor for', emailInboxRecord.email);

		const imap = new IMAPInterceptor({
			password: emailInboxRecord.imap.password,
			user: emailInboxRecord.imap.username,
			host: emailInboxRecord.imap.server,
			port: emailInboxRecord.imap.port,
			tls: emailInboxRecord.imap.secure,
			tlsOptions: {
				rejectUnauthorized: false,
			},
			// debug: (...args: any[]): void => console.log(...args),
		}, {
			deleteAfterRead: false,
			filter: [['UNSEEN'], ['SINCE', emailInboxRecord._updatedAt]],
			rejectBeforeTS: emailInboxRecord._updatedAt,
			markSeen: true,
		});

		imap.on('email', Meteor.bindEnvironment((email) => onEmailReceived(email, emailInboxRecord.email, emailInboxRecord.department)));

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
}

Meteor.startup(() => {
	configureEmailInboxes();
});
