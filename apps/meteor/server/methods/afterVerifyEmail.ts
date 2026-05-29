import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import { runAfterVerifyEmail } from '../lib/users/runAfterVerifyEmail';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		afterVerifyEmail(): void;
	}
}

Meteor.methods<ServerMethods>({
	async afterVerifyEmail() {
		methodDeprecationLogger.method('afterVerifyEmail', '9.0.0', '/v1/users.verifyEmail');

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail',
			});
		}

		await runAfterVerifyEmail(userId);
	},
});
