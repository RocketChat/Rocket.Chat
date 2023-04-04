import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.resetOwnE2EKey'(): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'e2e.resetOwnE2EKey': twoFactorRequired(async () => {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetOwnE2EKey',
			});
		}

		if (!(await resetUserE2EEncriptionKey(userId, false))) {
			return false;
		}
		return true;
	}),
});
