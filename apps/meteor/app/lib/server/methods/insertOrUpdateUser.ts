import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { saveUser } from '../functions/saveUser';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		insertOrUpdateUser(userData: Record<string, unknown>): Promise<string | boolean>;
	}
}

Meteor.methods<ServerMethods>({
	insertOrUpdateUser: twoFactorRequired(async (userData) => {
		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'insertOrUpdateUser',
			});
		}

		return saveUser(Meteor.userId(), userData);
	}),
});
