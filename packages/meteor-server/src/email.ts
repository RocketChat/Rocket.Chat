/**
 * Shim for meteor/email. Meteor's implementation wraps nodemailer configured
 * from MAIL_URL; Rocket.Chat routes almost all mail through its own Mailer.
 * The entrypoint (or the mailer setup) must install a transport before
 * Email.sendAsync is used.
 */

export type EmailOptions = {
	from?: string;
	to?: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | string[];
	subject?: string;
	text?: string;
	html?: string;
	headers?: Record<string, string>;
	attachments?: unknown[];
	mailComposer?: unknown;
};

type EmailSender = (options: EmailOptions) => Promise<void>;

let sender: EmailSender | undefined;

export const setEmailSender = (fn: EmailSender): void => {
	sender = fn;
};

export const Email = {
	async sendAsync(options: EmailOptions): Promise<void> {
		if (!sender) {
			throw new Error('Email.sendAsync: no transport configured — call setEmailSender() from the server entrypoint');
		}
		return sender(options);
	},
};
