import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { getStatusText } from '../../../lib/server/functions/getStatusText';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getUserStatusText(userId: string): Promise<string | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async getUserStatusText(userId) {
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUserStatusText' });
		}

		return getStatusText(userId);
	},
});
