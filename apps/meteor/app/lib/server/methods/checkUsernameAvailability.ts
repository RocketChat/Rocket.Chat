import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { checkUsernameAvailabilityWithValidation } from '../functions/checkUsernameAvailability';
import { RateLimiter } from '../lib';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		checkUsernameAvailability(username: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async checkUsernameAvailability(username) {
		methodDeprecationLogger.method('checkUsernameAvailability', '7.0.0');

		check(username, String);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'checkUsernameAvailability' });
		}

		return checkUsernameAvailabilityWithValidation(userId, username);
	},
});

RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
	userId() {
		return true;
	},
});
