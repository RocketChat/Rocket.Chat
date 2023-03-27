import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { settings } from '../../../settings/server';
import { checkUsernameAvailability } from '../functions/checkUsernameAvailability';
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
		methodDeprecationLogger.warn('checkUsernameAvailability will be deprecated in future versions of Rocket.Chat');

		check(username, String);

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user.username === username) {
			return true;
		}
		return checkUsernameAvailability(username);
	},
});

RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
	userId() {
		return true;
	},
});
