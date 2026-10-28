import nodemailer from 'nodemailer';
import type { SendMailOptions, SMTPPoolOptions, SMTPTransportOptions } from 'nodemailer';

import { SystemLogger } from '../../logger/system';

type MailTransport = {
	send: (mail: SendMailOptions) => Promise<void>;
	retire: () => void;
};

const createMailTransport = (options: SMTPTransportOptions | SMTPPoolOptions): MailTransport => {
	const transporter = nodemailer.createTransport(options);
	let pending = 0;
	let retired = false;

	const closeIfDrained = () => {
		if (retired && pending === 0) {
			transporter.close();
		}
	};

	return {
		async send(mail) {
			pending++;
			try {
				await transporter.sendMail(mail);
			} finally {
				pending--;
				closeIfDrained();
			}
		},
		retire() {
			retired = true;
			closeIfDrained();
		},
	};
};

let transport: MailTransport | undefined;

/**
 * Replaces the SMTP transport all server email is sent through; `undefined` leaves email unsent until SMTP is configured again.
 * Mail already handed to the previous transport is still delivered through it before it closes.
 */
export const configureMailTransport = (options: SMTPTransportOptions | SMTPPoolOptions | undefined): void => {
	transport?.retire();
	transport = options ? createMailTransport(options) : undefined;
};

export const sendMail = async (mail: SendMailOptions): Promise<void> => {
	if (process.env.TEST_MODE === 'true' || process.env.TEST_MODE === 'api') {
		SystemLogger.info({ msg: 'Email not sent in test mode', mail });
		return;
	}

	if (!transport) {
		SystemLogger.warn('Email not sent: SMTP is not configured');
		return;
	}

	await transport.send(mail);
};
