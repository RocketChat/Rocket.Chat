import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Users } from '@rocket.chat/models';

import * as Mailer from '../../../app/mailer/server/api';
import { settings } from '../../../app/settings/server';
import { Message } from '../../../app/ui-utils/server';

export async function sendViaEmail(
	data: {
		rid: string;
		toUsers: string[];
		toEmails: string[];
		subject: string;
		messages: string[];
		language: string;
	},
	user: IUser,
): Promise<{
	missing: string[];
}> {
	const emails = data.toEmails.map((email) => email.trim()).filter(Boolean);

	const missing = [...data.toUsers].filter(Boolean);

	(
		await Users.findUsersByUsernames(data.toUsers, {
			projection: { 'username': 1, 'emails.address': 1 },
		}).toArray()
	).forEach((user: IUser) => {
		const emailAddress = user.emails?.[0].address;

		if (!emailAddress) {
			return;
		}

		if (!Mailer.checkAddressFormat(emailAddress)) {
			throw new Error('error-invalid-email');
		}

		const found = missing.indexOf(String(user.username));
		if (found !== -1) {
			missing.splice(found, 1);
		}

		emails.push(emailAddress);
	});

	const lang = data.language || user.language || 'en';

	const dateTimeFormatter = new Intl.DateTimeFormat(lang, {
		dateStyle: 'short',
		timeStyle: 'short',
	});

	const html = (
		await Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
			sort: { ts: 1 },
		}).toArray()
	)
		.map((message: IMessage) => {
			const dateTime = dateTimeFormatter.format(new Date(message.ts));
			return `<p style='margin-bottom: 5px'><b>${
				message.u.username
			}</b> <span style='color: #aaa; font-size: 12px'>${dateTime}</span><br/>${Message.parse(message, data.language)}</p>`;
		})
		.join('');

	const email = user.emails?.[0]?.address;

	await Mailer.send({
		to: emails,
		from: settings.get('From_Email'),
		replyTo: email,
		subject: data.subject,
		html,
	});

	return { missing };
}
