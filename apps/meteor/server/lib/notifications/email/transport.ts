import nodemailer from 'nodemailer';
import type { SendMailOptions, SMTPPoolOptions, SMTPTransportOptions, Transporter } from 'nodemailer';

import { SystemLogger } from '../../logger/system';

let transport: Transporter | undefined;

/** Replaces the SMTP transport all server email is sent through; `undefined` leaves email unsent until SMTP is configured again. */
export const configureMailTransport = (options: SMTPTransportOptions | SMTPPoolOptions | string | undefined): void => {
	transport?.close();
	transport = options ? nodemailer.createTransport(options) : undefined;
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

	await transport.sendMail(mail);
};
