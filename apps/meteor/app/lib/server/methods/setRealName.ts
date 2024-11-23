import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { setRealName } from '../functions/setRealName';
import { RateLimiter } from '../lib';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setRealName(name: string): string;
	}
}

Meteor.methods<ServerMethods>({
	async setRealName(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setRealName' });
		}

		if (!settings.get('Accounts_AllowRealNameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setRealName' });
		}

		if (!(await setRealName(Meteor.userId(), name))) {
			throw new Meteor.Error('error-could-not-change-name', 'Could not change name', {
				method: 'setRealName',
			});
		}

		return name;
	},
});

RateLimiter.limitMethod('setRealName', 1, 1000, {
	userId: () => true,
});
