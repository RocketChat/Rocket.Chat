import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		userSetUtcOffset(utcOffset: number): void;
	}
}

Meteor.methods<ServerMethods>({
	async userSetUtcOffset(utcOffset) {
		methodDeprecationLogger.method('userSetUtcOffset', '9.0.0', '/v1/users.setPreferences');
		check(utcOffset, Number);

		if (!this.userId) {
			return;
		}

		await Users.setUtcOffset(this.userId, utcOffset);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'userSetUtcOffset',
		userId() {
			return true;
		},
	},
	1,
	60000,
);
