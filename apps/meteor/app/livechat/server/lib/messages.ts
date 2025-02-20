import dns from 'dns';
import * as util from 'util';

import { LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

const dnsResolveMx = util.promisify(dns.resolveMx);

type OfflineMessageData = {
	message: string;
	name: string;
	email: string;
	department?: string;
	host?: string;
};

export async function sendOfflineMessage(data: OfflineMessageData) {
	if (!settings.get('Livechat_display_offline_form')) {
		throw new Error('error-offline-form-disabled');
	}

	const { message, name, email, department, host } = data;

	if (!email) {
		throw new Error('error-invalid-email');
	}

	const emailMessage = `${message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');

	let html = '<h1>New livechat message</h1>';
	if (host && host !== '') {
		html = html.concat(`<p><strong>Sent from:</strong><a href='${host}'> ${host}</a></p>`);
	}
	html = html.concat(`
			<p><strong>Visitor name:</strong> ${name}</p>
			<p><strong>Visitor email:</strong> ${email}</p>
			<p><strong>Message:</strong><br>${emailMessage}</p>`);

	const fromEmail = settings.get<string>('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

	let from: string;
	if (fromEmail) {
		from = fromEmail[0];
	} else {
		from = settings.get<string>('From_Email');
	}

	if (settings.get('Livechat_validate_offline_email')) {
		const emailDomain = email.substr(email.lastIndexOf('@') + 1);

		try {
			await dnsResolveMx(emailDomain);
		} catch (e) {
			throw new Meteor.Error('error-invalid-email-address');
		}
	}

	// TODO Block offline form if Livechat_offline_email is undefined
	// (it does not make sense to have an offline form that does nothing)
	// `this.sendEmail` will throw an error if the email is invalid
	// thus this breaks livechat, since the "to" email is invalid, and that returns an [invalid email] error to the livechat client
	let emailTo = settings.get<string>('Livechat_offline_email');
	if (department && department !== '') {
		const dep = await LivechatDepartment.findOneByIdOrName(department, { projection: { email: 1 } });
		if (dep) {
			emailTo = dep.email || emailTo;
		}
	}

	const fromText = `${name} - ${email} <${from}>`;
	const replyTo = `${name} <${email}>`;
	const subject = `Livechat offline message from ${name}: ${`${emailMessage}`.substring(0, 20)}`;
	await sendEmail(fromText, emailTo, replyTo, subject, html);

	setImmediate(() => {
		void callbacks.run('livechat.offlineMessage', data);
	});
}

async function sendEmail(from: string, to: string, replyTo: string, subject: string, html: string): Promise<void> {
	await Mailer.send({
		to,
		from,
		replyTo,
		subject,
		html,
	});
}
