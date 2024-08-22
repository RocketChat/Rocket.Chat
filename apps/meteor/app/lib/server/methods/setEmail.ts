import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { setEmail } from '../functions/setEmail';
import { RateLimiter } from '../lib';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setEmail(email: string): string;
	}
}

Meteor.methods<ServerMethods>({
	async setEmail(email) {
		check(email, String);

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setEmail' });
		}

		if (!settings.get('Accounts_AllowEmailChange')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing email is not allowed', {
				method: 'setEmail',
				action: 'Changing_email',
			});
		}

		if (user.emails?.[0] && user.emails[0].address === email) {
			return email;
		}

		if (!(await setEmail(user._id, email))) {
			throw new Meteor.Error('error-could-not-change-email', 'Could not change email', {
				method: 'setEmail',
			});
		}

		return email;
	},
});

RateLimiter.limitMethod('setEmail', 1, 1000, {
	userId(/* userId*/) {
		return true;
	},
});
