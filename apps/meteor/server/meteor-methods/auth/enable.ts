import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { enableTotp } from '../../lib/2fa/functions/totp';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:enable': () => Promise<{ secret: string; url: string }>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:enable'() {
		methodDeprecationLogger.method('2fa:enable', '9.0.0', '/v1/users.enableTotp');
		return enableTotp(Meteor.userId());
	},
});
