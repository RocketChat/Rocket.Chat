import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';
import { getPresenceScope } from '../../lib/statusVisibility/hiddenUsers';
import { isHiddenFor } from '../../lib/statusVisibility/presenceScope';
import { getStatusText } from '../../lib/users/getStatusText';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUserStatusText(userId: string): Promise<string | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async getUserStatusText(userId) {
		methodDeprecationLogger.method('getUserStatusText', '9.0.0', '/v1/users.presence');
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserStatusText' });
		}

		const scope = await getPresenceScope(currentUserId);

		return isHiddenFor(scope, userId) ? undefined : getStatusText(userId);
	},
});
