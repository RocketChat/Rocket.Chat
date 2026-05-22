import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import * as Mailer from '../../lib/notifications/email/api';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendSMTPTestEmail(): {
			message: string;
			params: string[];
		};
	}
}

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'sendSMTPTestEmail',
		userId() {
			return true;
		},
	},
	1,
	1000,
);
