import type { ServerMethods } from '@rocket.chat/ddp-client';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Mailer } from '../lib/Mailer';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'Mailer:unsubscribe'(_id: string, createdAt: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'Mailer:unsubscribe'(_id, createdAt) {
		methodDeprecationLogger.method('Mailer:unsubscribe', '7.0.0');

		return Mailer.unsubscribe(_id, createdAt);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'Mailer:unsubscribe',
		connectionId() {
			return true;
		},
	},
	1,
	60000,
);
