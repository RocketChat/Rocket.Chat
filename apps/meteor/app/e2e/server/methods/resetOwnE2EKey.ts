import { MeteorError } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.resetOwnE2EKey'(): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	'e2e.resetOwnE2EKey': twoFactorRequired(async () => {
		const userId = Meteor.userId();

		if (!userId) {
			throw new MeteorError('error-invalid-user', 'Invalid user', {
				method: 'resetOwnE2EKey',
			});
		}

		if (!(await resetUserE2EEncriptionKey(userId, false))) {
			throw new MeteorError('failed-reset-e2e-password', 'Failed to reset E2E password', {
				method: 'resetOwnE2EKey',
			});
		}
		return true;
	}),
});
