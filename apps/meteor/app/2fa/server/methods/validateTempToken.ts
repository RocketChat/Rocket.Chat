import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { validateTotpTempToken } from '../functions/totp';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:validateTempToken': (userToken: string) => { codes: string[] } | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:validateTempToken'(userToken) {
		methodDeprecationLogger.method('2fa:validateTempToken', '9.0.0', '/v1/users.totp.validate');
		const { 'x-auth-token': xAuthToken } = this.connection?.httpHeaders ?? {};
		return validateTotpTempToken(Meteor.userId(), userToken, xAuthToken);
	},
});
