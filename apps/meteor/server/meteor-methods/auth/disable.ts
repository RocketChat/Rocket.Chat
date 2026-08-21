import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { disableTotp } from '../../lib/2fa/functions/totp';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:disable': (code: string) => Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:disable'(code) {
		methodDeprecationLogger.method('2fa:disable', '9.0.0', '/v1/users.disableTotp');
		return disableTotp(Meteor.userId(), code);
	},
});
