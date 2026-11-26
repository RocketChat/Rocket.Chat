import type { MailerProps } from './mailer/MailerParamsPOST.js';
import type { MailerUnsubscribeProps } from './mailer/MailerUnsubscribeParamsPOST.js';

export type MailerEndpoints = {
	'/v1/mailer': {
		POST: (params: MailerProps) => void;
	};

	'/v1/mailer.unsubscribe': {
		POST: (params: MailerUnsubscribeProps) => void;
	};
};
