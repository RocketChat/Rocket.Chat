import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { disableTotp } from '../functions/totp';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:disable': (code: string) => Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:disable'(code) {
		methodDeprecationLogger.method('2fa:disable', '9.0.0', '/v1/users.totp.disable');
		return disableTotp(Meteor.userId(), code);
	},
});
