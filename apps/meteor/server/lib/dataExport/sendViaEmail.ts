import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Users } from '@rocket.chat/models';
import moment from 'moment';

import * as Mailer from '../../../app/mailer/server/api';
import { settings } from '../../../app/settings/server';
import { Message } from '../../../app/ui-utils/server';
import { getMomentLocale } from '../getMomentLocale';

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

	const email = user.emails?.[0]?.address;
	const lang = data.language || user.language || 'en';

	const localMoment = moment();

	if (lang !== 'en') {
		const localeFn = await getMomentLocale(lang);
		if (localeFn) {
			Function(localeFn).call({ moment });
			localMoment.locale(lang);
		}
	}

	const html = (
		await Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
			sort: { ts: 1 },
		}).toArray()
	)
		.map((message: IMessage) => {
			const dateTime = moment(message.ts).locale(lang).format('L LT');
			return `<p style='margin-bottom: 5px'><b>${
				message.u.username
			}</b> <span style='color: #aaa; font-size: 12px'>${dateTime}</span><br/>${Message.parse(message, data.language)}</p>`;
		})
		.join('');

	await Mailer.send({
		to: emails,
		from: settings.get('From_Email'),
		replyTo: email,
		subject: data.subject,
		html,
	});

	return { missing };
}
