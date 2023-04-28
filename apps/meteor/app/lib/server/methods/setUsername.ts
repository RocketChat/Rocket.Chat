import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { RateLimiter } from '../lib';
import { setUsernameWithValidation } from '../functions/setUsername';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUsername(username: string, param?: { joinDefaultChannelsSilenced?: boolean }): string;
	}
}

Meteor.methods<ServerMethods>({
	async setUsername(username, param = {}) {
		check(username, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		await setUsernameWithValidation(userId, username, param.joinDefaultChannelsSilenced);

		return username;
	},
});

RateLimiter.limitMethod('setUsername', 1, 1000, {
	userId() {
		return true;
	},
});
