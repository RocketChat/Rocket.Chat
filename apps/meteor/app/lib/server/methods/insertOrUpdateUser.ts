import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { saveUser } from '../functions/saveUser';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		insertOrUpdateUser(userData: Record<string, unknown>): Promise<string | boolean>;
	}
}

Meteor.methods<ServerMethods>({
	insertOrUpdateUser: twoFactorRequired(async (userData) => {
		methodDeprecationLogger.method('insertOrUpdateUser', '8.0.0');

		check(userData, Object);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'insertOrUpdateUser',
			});
		}

		return saveUser(userId, userData);
	}),
});
