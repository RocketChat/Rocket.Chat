import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { codesRemainingTotp } from '../functions/totp';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:checkCodesRemaining': () => { remaining: number };
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:checkCodesRemaining'() {
		methodDeprecationLogger.method('2fa:checkCodesRemaining', '9.0.0', '/v1/users.totp.codesRemaining');
		return codesRemainingTotp(Meteor.userId());
	},
});
