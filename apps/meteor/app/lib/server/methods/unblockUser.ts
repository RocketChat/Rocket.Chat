import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { unblockUserMethod } from '../functions/unblockUser';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unblockUser({ rid, blocked }: { rid: string; blocked: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async unblockUser({ rid, blocked }) {
		methodDeprecationLogger.method('unblockUser', '9.0.0', '/v1/im.blockUser');
		check(rid, String);
		check(blocked, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unblockUser' });
		}

		await unblockUserMethod(userId, { rid, blocked });

		return true;
	},
});
