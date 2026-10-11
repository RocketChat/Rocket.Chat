import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { codesRemainingTotp } from '../../lib/2fa/functions/totp';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'2fa:checkCodesRemaining': () => { remaining: number };
	}
}

Meteor.methods<ServerMethods>({
	async '2fa:checkCodesRemaining'() {
		methodDeprecationLogger.method('2fa:checkCodesRemaining', '9.0.0', '/v1/users.totpCodesRemaining');
		return codesRemainingTotp(Meteor.userId());
	},
});
