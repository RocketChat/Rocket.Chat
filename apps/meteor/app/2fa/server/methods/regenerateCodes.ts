import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { regenerateTotpCodes } from '../functions/totp';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:regenerateCodes': (userToken: string) => { codes: string[] } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:regenerateCodes'(userToken) {
		methodDeprecationLogger.method('2fa:regenerateCodes', '9.0.0', '/v1/users.totp.regenerateCodes');
		return regenerateTotpCodes(Meteor.userId(), userToken);
	},
});
