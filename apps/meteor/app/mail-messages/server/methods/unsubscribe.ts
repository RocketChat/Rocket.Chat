import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Mailer } from '../lib/Mailer';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'Mailer:unsubscribe'(_id: string, createdAt: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'Mailer:unsubscribe'(_id, createdAt) {
		methodDeprecationLogger.warn('Mailer:unsubscribe will be deprecated in future versions of Rocket.Chat');

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
